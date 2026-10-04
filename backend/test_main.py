"""Backend pipeline tests using a deterministic fake Ollama HTTP response."""
import json
import unittest
from collections.abc import Sequence
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend import main


class FakeOllamaClient:
    def __init__(self, responses: Sequence[object], **_: object) -> None:
        self.responses = list(responses)

    async def __aenter__(self) -> "FakeOllamaClient":
        return self

    async def __aexit__(self, *_: object) -> None:
        return None

    async def post(self, url: str, *, json: dict[str, object]) -> object:
        self.last_url = url
        self.last_payload = json
        next_response = self.responses.pop(0)
        if isinstance(next_response, Exception):
            raise next_response
        return next_response


def complete_profile(**values: object) -> dict[str, object]:
    profile: dict[str, object] = {
        'name': '', 'role': '', 'location': '', 'email': '', 'intro': '', 'about': '',
        'skills': [], 'projects': [], 'experience': '', 'education': '',
        'achievements': '', 'certifications': '', 'github': '', 'linkedin': '',
    }
    profile.update(values)
    return profile


def ollama_response(content: str):
    import httpx

    return httpx.Response(200, json={"message": {"content": content}})


class GeneratePipelineTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(main.app)

    def test_schema_constrained_response_is_validated_and_returned(self) -> None:
        generated = complete_profile(name="Riley", role="Frontend developer", intro="I build accessible apps.")
        fake = FakeOllamaClient([ollama_response(json.dumps(generated))])
        with patch.object(main.httpx, "AsyncClient", return_value=fake):
            response = self.client.post("/api/generate", json={"prompt": "I'm Riley, a frontend developer who builds accessible apps."})

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["profile"]["name"], "Riley")
        self.assertEqual(body["profile"]["skills"], [])
        self.assertFalse(body["repaired"])
        self.assertEqual(fake.last_payload["format"], main.schema_for_profile())
        self.assertFalse(fake.last_payload["stream"])

    def test_truncated_response_is_repaired_once_and_validated(self) -> None:
        generated = complete_profile(name="Riley", role="Frontend developer", skills=["React"])
        fake = FakeOllamaClient([
            ollama_response('{"name":"Riley","role":"Frontend'),
            ollama_response(f"```json\n{json.dumps(generated)}\n```")
        ])
        with patch.object(main.httpx, "AsyncClient", return_value=fake):
            response = self.client.post("/api/generate", json={"prompt": "I'm Riley. I use React."})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["profile"]["skills"], ["React"])
        self.assertTrue(response.json()["repaired"])
        self.assertEqual(len(fake.responses), 0)

    def test_valid_but_incomplete_object_is_repaired_once(self) -> None:
        fake = FakeOllamaClient([
            ollama_response('{"name":"Riley"}'),
            ollama_response(json.dumps(complete_profile(name="Riley", role="Developer"))),
        ])
        with patch.object(main.httpx, "AsyncClient", return_value=fake):
            response = self.client.post("/api/generate", json={"prompt": "I'm Riley, a developer."})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["repaired"])
        self.assertEqual(response.json()["profile"]["role"], "Developer")

    def test_invalid_response_after_repair_returns_structured_json_error(self) -> None:
        fake = FakeOllamaClient([ollama_response("not json"), ollama_response("still not json")])
        with patch.object(main.httpx, "AsyncClient", return_value=fake):
            response = self.client.post("/api/generate", json={"prompt": "I'm a developer."})

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.headers["content-type"], "application/json")
        self.assertIn("configured model returned incomplete or invalid", response.json()["error"]["message"])

    def test_empty_or_invalid_request_has_json_error_envelope(self) -> None:
        response = self.client.post("/api/generate", json={"prompt": "  "})
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.headers["content-type"], "application/json")
        self.assertIn("error", response.json())

    def test_malformed_ollama_http_body_still_returns_json_error(self) -> None:
        import httpx

        fake = FakeOllamaClient([httpx.Response(200, content=b"")])
        with patch.object(main.httpx, "AsyncClient", return_value=fake):
            response = self.client.post("/api/generate", json={"prompt": "I'm a developer."})
        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.headers["content-type"], "application/json")
        self.assertEqual(response.json()["error"]["code"], "ollama_error")

    def test_ollama_transport_error_returns_structured_error(self) -> None:
        import httpx

        fake = FakeOllamaClient([httpx.ConnectError("connection refused")])
        with patch.object(main.httpx, "AsyncClient", return_value=fake):
            response = self.client.post("/api/generate", json={"prompt": "I'm a developer."})
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["error"]["code"], "ollama_unavailable")

    def test_section_regeneration_preserves_other_profile_fields(self) -> None:
        fake = FakeOllamaClient([ollama_response(json.dumps(complete_profile(about="I enjoy solving useful problems.")))])
        with patch.object(main.httpx, "AsyncClient", return_value=fake):
            response = self.client.post("/api/generate", json={
                "section": "About",
                "profile": {"name": "Riley", "about": "Rough notes"},
            })

        self.assertEqual(response.status_code, 200)
        profile = response.json()["profile"]
        self.assertEqual(profile["about"], "I enjoy solving useful problems.")
        self.assertEqual(profile["name"], "Riley")

    def test_unsupported_skills_and_links_are_removed(self) -> None:
        request = main.GenerateRequest(prompt="I use Python.")
        generated = main.Profile.model_validate(complete_profile(
            skills=["Python", "Rust"],
            github="https://made-up.example/profile",
            email="not-provided@example.com",
        ))
        grounded = main.ground_explicit_facts(generated, request)
        self.assertEqual(grounded.skills, ["Python"])
        self.assertEqual(grounded.github, "")
        self.assertEqual(grounded.email, "")


if __name__ == "__main__":
    unittest.main()
