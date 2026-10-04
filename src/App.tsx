import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, ArrowRight, ArrowUpRight, Sparkles, WandSparkles, Sun, Moon, Github, Linkedin, Mail, ExternalLink, Download, Check, Menu, X, Plus, Trash2, Eye, RotateCcw, Zap, ShieldCheck, Palette, FileText, Star, Code2, Globe, LayoutTemplate, SlidersHorizontal, LoaderCircle } from 'lucide-react';
import { emptyProfile, demoProfile, type Profile, type Project } from './types';

const examples = ['I’m a CS student who loves building accessible apps…','I’m a frontend developer transitioning into product engineering…','I’m a self-taught developer with a few projects and a lot of curiosity…'];
const sections = ['Hero','About','Skills','Projects','Experience','Education','Achievements','Certifications','Social links','Contact'];
const templates = ['Studio','Editorial','Mono','Aurora','Classic'];
const starter = 'I’m a product-minded full-stack developer in Brooklyn. I build thoughtful digital experiences with React and TypeScript. I recently made a creator storefront and a community food map. I studied computer science at Pratt and have been freelancing for three years.';

export default function App() {
 const [profile,setProfile] = useState<Profile>(()=>{try{return JSON.parse(localStorage.getItem('pp-profile')||'null')||demoProfile}catch{return demoProfile}});
 const [isDemo,setIsDemo] = useState(()=>localStorage.getItem('pp-demo')!=='false');
 const [prompt,setPrompt] = useState(''); const [dark,setDark] = useState(false); const [template,setTemplate] = useState('Studio'); const [accent,setAccent] = useState('#498866'); const [tab,setTab] = useState<'preview'|'edit'>('preview'); const [activeSection,setActiveSection] = useState('Hero'); const [busy,setBusy] = useState(false); const [notice,setNotice] = useState(''); const [mobileMenu,setMobileMenu] = useState(false); const [recruiter,setRecruiter] = useState(false); const [openCustomizer,setOpenCustomizer] = useState(false);
 useEffect(()=>{localStorage.setItem('pp-profile',JSON.stringify(profile));localStorage.setItem('pp-demo',String(isDemo))},[profile,isDemo]);
 const score=useMemo(()=>{let n=0; if(profile.name)n+=8;if(profile.role)n+=8;if(profile.intro)n+=10;if(profile.about)n+=12;if(profile.skills.length)n+=12;if(profile.projects.length)n+=20;if(profile.experience)n+=10;if(profile.education)n+=7;if(profile.achievements)n+=5;if(profile.email)n+=4;if(profile.github||profile.linkedin)n+=4;return n},[profile]);
 const update=(key:keyof Profile,value:any)=>{setIsDemo(false);setProfile(p=>({...p,[key]:value}))};
 const generate=async(text=prompt,section?:string)=>{
  if(!text.trim()&&!section){setNotice('Add a little about yourself to get started.');return}
  setBusy(true);setNotice('');
  const sourceProfile=isDemo&&text.trim()?emptyProfile:profile;
  try{
   const response=await fetch(`${import.meta.env.VITE_API_BASE_URL||''}/api/generate`,{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:text,profile:sourceProfile,section})
   });
   const data=await readApiResponse(response);
   if(!isProfileShape(data.profile))throw new Error('The AI service returned an invalid profile. Please retry.');
   setProfile(data.profile);setIsDemo(false);if(!section)setPrompt('');
   setNotice(data.repaired?'Your portfolio is ready. Qwen Coder response was repaired and validated.':'Your portfolio is ready. Review every detail before publishing.');
  }catch(error){
   setProfile(localFallback(text,sourceProfile,section));setIsDemo(false);
   setNotice(error instanceof Error?`${error.message} A draft was created from the details you shared.`:'Could not reach the AI service. A draft was created from the details you shared.');
  }finally{setBusy(false)}
 };
 const improve=()=>generate(starter); const setField=(key:keyof Profile,label:string)=> <label className="field-label">{label}<textarea rows={key==='about'||key==='intro'?3:2} value={String(profile[key]||'')} onChange={e=>update(key,e.target.value)} placeholder={`Add your ${label.toLowerCase()}…`}/></label>;
 const addProject=()=>update('projects',[...profile.projects,{name:'New project',description:'',stack:[],github:'',demo:''}]);
 const setProject=(i:number,key:keyof Project,value:any)=>update('projects',profile.projects.map((p,j)=>j===i?{...p,[key]:value}:p));
 const moveProject=(i:number,step:number)=>{const next=[...profile.projects],target=i+step;if(target<0||target>=next.length)return;[next[i],next[target]]=[next[target],next[i]];update('projects',next)};
 const download=()=>{const html=exportHtml(profile,template,accent);const css=html.match(/<style>([\s\S]*?)<\/style>/)?.[1]||'';const index=html.replace(/<style>[\s\S]*?<\/style>/,`<link rel="stylesheet" href="styles.css">`).replace('</main>', '</main><script src="script.js"></script>');const js="document.querySelectorAll('a[href^=\\\"#\\\"]').forEach(link=>link.addEventListener('click',event=>{const target=document.querySelector(link.getAttribute('href'));if(target){event.preventDefault();target.scrollIntoView({behavior:'smooth'});}}));";const readme=`${profile.name||'My'} portfolio\n\nDeploy anywhere static sites are hosted:\n• Netlify: drag this folder into Netlify Drop or connect your Git repository.\n• GitHub Pages: commit these files to a repository and enable Pages in repository Settings.\n• Vercel: import the repository with the framework preset set to Other; output directory is the repository root.\n\nThis site has no build step or external runtime dependencies. Edit index.html and styles.css directly.`;const blob=new Blob([zipFiles({'index.html':index,'styles.css':css,'script.js':js,'README.txt':readme})],{type:'application/zip'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${slug(profile.name||'my-portfolio')}-portfolio.zip`;a.click();URL.revokeObjectURL(a.href);setNotice('Portfolio ZIP downloaded with HTML, CSS, JavaScript, and deployment instructions.');};
 const copy=(text:string)=>{navigator.clipboard.writeText(text).then(()=>setNotice('Copied to clipboard.'))};
 const renderActiveSection = () => {
  switch (activeSection) {
   case 'Hero':
    return <>{setField('name','Name')}{setField('role','Title / role')}{setField('intro','One-line introduction')}</>;
   case 'About':
    return setField('about','About you');
   case 'Skills':
    return <label className="field-label">Skills<input value={profile.skills.join(', ')} onChange={e=>update('skills',e.target.value.split(',').map(x=>x.trim()).filter(Boolean))} placeholder="React, TypeScript, Node.js"/><small>Separate skills with commas.</small></label>;
   case 'Projects':
    return <>
     <div className="project-edit-list">
      {profile.projects.map((project,index)=>(
       <div className="project-editor" key={`${index}-${project.name}`}>
        <div className="project-editor-top">
         <span>{project.name||'Untitled project'}</span>
         <span className="project-order-controls">
          <button onClick={()=>moveProject(index,-1)} disabled={index===0} aria-label="Move project up"><ArrowUp size={13}/></button>
          <button onClick={()=>moveProject(index,1)} disabled={index===profile.projects.length-1} aria-label="Move project down"><ArrowDown size={13}/></button>
          <button onClick={()=>update('projects',profile.projects.filter((_,i)=>i!==index))} aria-label="Remove project"><Trash2 size={14}/></button>
         </span>
        </div>
        <input value={project.name} onChange={e=>setProject(index,'name',e.target.value)} placeholder="Project name"/>
        <textarea rows={3} value={project.description} onChange={e=>setProject(index,'description',e.target.value)} placeholder="What does it do? What did you contribute?"/>
        <input value={project.stack.join(', ')} onChange={e=>setProject(index,'stack',e.target.value.split(',').map(x=>x.trim()).filter(Boolean))} placeholder="Tech stack, separated by commas"/>
        <div className="two-inputs">
         <input value={project.github} onChange={e=>setProject(index,'github',e.target.value)} placeholder="GitHub URL"/>
         <input value={project.demo} onChange={e=>setProject(index,'demo',e.target.value)} placeholder="Live demo URL"/>
        </div>
       </div>
      ))}
     </div>
     <button className="button button-outline add-project" onClick={addProject}><Plus size={15}/> Add project</button>
    </>;
   case 'Experience':
    return setField('experience','Experience');
   case 'Education':
    return setField('education','Education');
   case 'Achievements':
    return setField('achievements','Achievements');
   case 'Certifications':
    return setField('certifications','Certifications');
   case 'Social links':
    return <>{setField('github','GitHub URL')}{setField('linkedin','LinkedIn URL')}</>;
   case 'Contact':
    return <>{setField('email','Email address')}{setField('location','Location')}</>;
   default:
    return null;
  }
 };
 return <div className={dark?'app dark':'app'} style={{'--accent':accent} as CSSProperties}>
  <header className="topbar"><a className="brand" href="#top"><span className="brand-mark"><WandSparkles size={17}/></span><span>Portfolio<span className="brand-light">Pilot</span><sup>AI</sup></span></a><nav className="main-nav"><a href="#how">How it works</a><a href="#features">Features</a><a href="#open-source">Open-source AI</a></nav><div className="top-actions"><span className="ollama-status"><i/>Qwen Coder via Ollama</span><button className="icon-button" onClick={()=>setDark(!dark)} aria-label="Toggle theme">{dark?<Sun size={17}/>:<Moon size={17}/>}</button><a href="#workspace" className="button button-dark button-small">Open workspace <ArrowRight size={15}/></a><button className="mobile-toggle" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Open navigation">{mobileMenu?<X/>:<Menu/>}</button></div></header>
  {mobileMenu&&<div className="mobile-menu"><a href="#how" onClick={()=>setMobileMenu(false)}>How it works</a><a href="#features" onClick={()=>setMobileMenu(false)}>Features</a><a href="#open-source" onClick={()=>setMobileMenu(false)}>Open-source AI</a><a href="#workspace" onClick={()=>setMobileMenu(false)}>Open workspace</a></div>}
  <main id="top"><motion.section className="hero" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.65,ease:'easeOut'}}><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/> YOUR STORY, WELL TOLD <span className="eyebrow-line"/></div><h1>Your next chapter,<br/><em>beautifully built.</em></h1><p className="hero-sub">A portfolio that sounds like you, looks like you, and opens the right doors. Start with a sentence. Leave with a site.</p><div className="hero-ctas"><a className="button button-dark" href="#workspace">Build my portfolio <ArrowRight size={16}/></a><button className="button button-ghost" onClick={()=>document.getElementById('showcase')?.scrollIntoView({behavior:'smooth'})}><span className="play-icon">▶</span> See the preview</button></div><div className="trust-row"><div className="avatars"><b>AM</b><b>JL</b><b>SK</b></div><div><strong>Made for your next move</strong><small>Students · Developers · Career switchers</small></div><div className="trust-sep"/><span className="open-pill"><ShieldCheck size={14}/> Private by design</span></div></div>
  <div className="hero-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-sun"/><div className="art-card card-back"><div className="tiny-bar"/><div className="tiny-lines"><i/><i/><i/></div><div className="tiny-avatar">a.</div></div><div className="art-card card-front"><div className="card-kicker">PORTFOLIO / SELECTED WORK</div><div className="art-avatar">AM</div><h3>Alex Morgan</h3><p>Developer & digital<br/>problem solver</p><div className="art-tags"><i>React</i><i>Design</i><i>Ideas</i></div><div className="card-arrow"><ArrowUpRight size={16}/></div></div><span className="float-tag tag-ai"><Sparkles size={14}/> Made with AI, refined by you</span><span className="float-tag tag-live"><i/> Live preview</span><div className="art-doodle">✳</div></div></motion.section>
  <section className="stats-strip"><div><strong>One prompt</strong><span>to a complete portfolio</span></div><div><strong>5 designs</strong><span>to make it yours</span></div><div><strong>100% yours</strong><span>edit, export, deploy</span></div><div><strong>Open-source AI</strong><span>private, local, transparent</span></div></section>
  <section className="workspace-section" id="workspace"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR CREATIVE WORKSPACE</div><h2>Let’s make something <em>you.</em></h2></div><button className="button button-outline" onClick={()=>{setProfile(demoProfile);setIsDemo(true);setPrompt('');setNotice('Demo profile loaded. Edit any detail to make it yours.')}}><RotateCcw size={15}/> Reset demo</button></div><div className="workbench"><div className="editor-pane"><div className="pane-header"><div><span className="pane-step">01</span><div><strong>Tell us your story</strong><small>The more you share, the more it feels like you.</small></div></div><span className="optional">YOUR WORDS, YOUR WAY</span></div><div className="prompt-wrap"><textarea aria-label="Describe yourself" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="I’m a product-minded developer who loves building thoughtful digital experiences. I work with React and TypeScript, and recently built…"/><div className="prompt-foot"><span><Sparkles size={13}/> Your details stay yours</span><span>{prompt.length} characters</span></div></div><div className="examples"><span>NEED A NUDGE?</span>{examples.map(x=><button key={x} onClick={()=>setPrompt(x)}>{x}</button>)}</div><button className="button button-accent generate-button" onClick={()=>generate()} disabled={busy}>{busy?<><LoaderCircle className="spin" size={16}/> Building your portfolio…</>:<><WandSparkles size={16}/> Generate my portfolio <ArrowRight size={16}/></>}</button><div className="divider-label"><span/> OR GET A HEAD START <span/></div><button className="improve-button" onClick={improve} disabled={busy}><div className="improve-icon"><Zap size={17}/></div><div><strong>Try the sample profile</strong><small>See what PortfolioPilot can create</small></div><ArrowRight size={16}/></button>{notice&&<div className="notice" role="status">{notice}</div>}<div className="privacy-note"><ShieldCheck size={14}/> Sent only to your configured Ollama service.</div></div>
  <div className="preview-pane" id="showcase">
    <div className="preview-toolbar">
     <div className="preview-tabs">
      <button className={tab==='preview'?'selected':''} onClick={()=>setTab('preview')}><Eye size={14}/> Preview</button>
      <button className={tab==='edit'?'selected':''} onClick={()=>setTab('edit')}><SlidersHorizontal size={14}/> Edit content</button>
     </div>
     <div className="preview-tools">
      <button title="Customize appearance" onClick={()=>setOpenCustomizer(!openCustomizer)}><Palette size={15}/><span>Customize</span></button>
      <button title="Download portfolio" onClick={download}><Download size={15}/></button>
      <button title="Copy deployment instructions" onClick={()=>copy('Deploy your portfolio: upload the downloaded HTML file to Netlify Drop, or push index.html to a GitHub Pages repository.')}><ExternalLink size={15}/></button>
     </div>
    </div>
    {openCustomizer&&<div className="customizer">
     <div><strong>Accent</strong><div className="swatches">{['#498866','#5269a7','#bc7258','#8a66aa','#202824'].map(color=><button key={color} aria-label={`Set accent ${color}`} style={{background:color}} onClick={()=>setAccent(color)}/>)}</div></div>
     <div><strong>Template</strong><div className="template-switch">{templates.map(item=><button key={item} className={template===item?'on':''} onClick={()=>setTemplate(item)}>{item}</button>)}</div></div>
    </div>}
    {tab === 'preview' ? (
     <PortfolioPreview profile={profile} template={template} recruiter={recruiter} setRecruiter={setRecruiter}/>
    ) : (
     <div className="edit-panel">
      <div className="edit-nav">
       {sections.map((section,index)=>(
        <button key={section} className={activeSection===section?'active':''} onClick={()=>setActiveSection(section)}>
         <span>{String(index+1).padStart(2,'0')}</span>{section}
        </button>
       ))}
      </div>
      <div className="edit-fields">
       <div className="edit-title">
        <div><small>EDIT SECTION</small><h3>{activeSection}</h3></div>
        <button className="button button-outline button-small" onClick={()=>generate(undefined,activeSection)} disabled={busy}>
         <Sparkles size={14}/> Regenerate with AI
        </button>
       </div>
       {renderActiveSection()}
      </div>
     </div>
    )}
   </div>
  </div></section>
  <section className="score-section"><div className="score-card"><div className="score-left"><div className="score-gauge" style={{'--score':`${score}%`} as CSSProperties}><div><strong>{score}</strong><small>/100</small></div></div><div><span className="eyebrow">PORTFOLIO SCORE</span><h3>{score>=80?'Looking sharp.':score>=55?'A strong start.':'Your story is taking shape.'}</h3><p>A quick read on how ready your portfolio is to make a great first impression.</p></div></div><div className="score-insights"><div><Check size={15}/><span><strong>Clear personal story</strong><small>{profile.intro?'Your intro tells recruiters what you do.':'Add a one-line intro to tell your story.'}</small></span></div><div><Check size={15}/><span><strong>Project proof</strong><small>{profile.projects.length?`${profile.projects.length} project${profile.projects.length===1?'':'s'} to show what you can do.`:'Add a project to show what you can do.'}</small></span></div><div><ArrowUpRight size={15}/><span><strong>Make your impact concrete</strong><small>Add outcomes or numbers to a project description.</small></span></div></div><button className="button button-dark" onClick={improve} disabled={busy}><Sparkles size={15}/> Improve my portfolio</button></div></section>
  <section className="features-section" id="features"><div className="features-heading"><div className="eyebrow"><span className="eyebrow-dot"/> MADE FOR YOUR NEXT MOVE</div><h2>Everything you need to<br/><em>show your best work.</em></h2><p>A thoughtful first draft is just the start. Make every detail yours, then share it with confidence.</p></div><div className="feature-grid"><Feature icon={<LayoutTemplate/>} number="01" title="Five distinct templates" copy="Find a look that fits your work, from quiet editorial to vibrant and modern."/><Feature icon={<FileText/>} number="02" title="Copy that sounds like you" copy="Turn rough notes into clear, confident writing without making up your story."/><Feature icon={<Star/>} number="03" title="Recruiter-ready by design" copy="Bring your most relevant strengths forward with a focused recruiter view."/><Feature icon={<Download/>} number="04" title="Ready when you are" copy="Export a self-contained site and publish it on your favorite host."/></div></section>
  <section className="how-section" id="how"><div className="how-top"><div><div className="eyebrow"><span className="eyebrow-dot"/> SIMPLE BY DESIGN</div><h2>From “about me”<br/>to <em>out there.</em></h2></div><a className="button button-outline" href="#workspace">Give it a try <ArrowRight size={15}/></a></div><div className="steps"><Step n="01" title="Start with your story" copy="Share your experience in the words you’d actually use. A few rough notes are plenty." icon={<FileText/>}/><Step n="02" title="Shape it together" copy="AI organizes and polishes your details. You stay in control of every word." icon={<WandSparkles/>}/><Step n="03" title="Make it yours" copy="Choose a design, refine the copy, and preview the complete site as you go." icon={<Palette/>}/><Step n="04" title="Take it anywhere" copy="Download your site and deploy it in minutes, on a platform you choose." icon={<Globe/>}/></div></section>
  <section className="opensource" id="open-source"><div className="oss-icon"><Code2 size={25}/></div><div className="oss-copy"><div className="eyebrow"><span className="eyebrow-dot"/> OPEN SOURCE, OPEN BY DESIGN</div><h2>AI that works <em>with you.</em></h2><p>PortfolioPilot uses the open-weight Qwen Coder model through Ollama. Run the model locally for more privacy and control. Your profile stays in your browser unless you choose to send it to your local AI service.</p></div><div className="oss-stack"><div><span>MODEL</span><strong>Qwen Coder</strong></div><div><span>RUNTIME</span><strong>Ollama</strong></div><div><span>YOUR DATA</span><strong>Yours to keep</strong></div></div></section>
  <section className="closing-cta"><span className="cta-spark">✳</span><div className="eyebrow"><span className="eyebrow-dot"/> YOUR NEXT OPPORTUNITY STARTS HERE</div><h2>Let’s make your next<br/><em>hello unforgettable.</em></h2><a className="button button-dark" href="#workspace">Build your portfolio <ArrowRight size={16}/></a><small>No design skills needed. Just your story.</small></section></main><footer className="footer"><a className="brand" href="#top"><span className="brand-mark"><WandSparkles size={15}/></span><span>Portfolio<span className="brand-light">Pilot</span><sup>AI</sup></span></a><span>Thoughtfully built for what’s next.</span><span>© 2025 PortfolioPilot AI · Open-source by design</span></footer>
 </div>
}

function PortfolioPreview({profile:p,template,recruiter,setRecruiter}:{profile:Profile;template:string;recruiter:boolean;setRecruiter:(b:boolean)=>void}){const title=p.role||'Your next role';const name=p.name||'Your name';return <div className={`portfolio-preview template-${template.toLowerCase()}`}><div className="portfolio-top"><a className="preview-brand" href="#workspace">{p.name?p.name.split(' ')[0].toLowerCase():'yourname'}<b>.</b></a><div className="portfolio-links"><a href="#p-projects">Work</a><a href="#p-about">About</a><a href={`mailto:${p.email||''}`}>Contact <ArrowUpRight size={12}/></a></div></div><div className="preview-body"><div className="portfolio-hero"><div className="portfolio-tag"><i/> AVAILABLE FOR OPPORTUNITIES</div><div className="hero-monogram">{name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()}</div><p className="portfolio-kicker">{p.location||'Developer · Your city'}</p><h2>Hey, I’m <em>{name.split(' ')[0]}.</em><br/>{title}.</h2><p className="portfolio-intro">{p.intro||'I build thoughtful digital experiences. Add your intro to make this portfolio yours.'}</p><a className="preview-cta" href={`mailto:${p.email||''}`}>Let’s talk <ArrowUpRight size={14}/></a></div><div className="portfolio-projects" id="p-projects"><div className="p-section-heading"><span>SELECTED WORK / 0{p.projects.length}</span><button className={recruiter?'recruit-active':''} onClick={()=>setRecruiter(!recruiter)}><Star size={12}/>{recruiter?'Recruiter view on':'Recruiter view'}</button></div>{(recruiter?[...p.projects].sort((a,b)=>b.description.length-a.description.length):p.projects).slice(0,3).map((project,i)=><div className="p-project" key={project.name+i}><div className={`p-project-image image-${i+1}`}><span>{project.name.slice(0,1)||'✳'}</span><div className="project-image-lines"><i/><i/><i/></div><ArrowUpRight size={16}/></div><div className="p-project-text"><div><h3>{project.name||'Project name'}</h3><p>{project.description||'Describe the challenge you solved and the work you did.'}</p></div><div className="p-project-bottom"><span>{project.stack.map(s=><i key={s}>{s}</i>)}</span><div>{project.github&&<a href={safeLink(project.github)} target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={14}/></a>}{project.demo&&<a href={safeLink(project.demo)} target="_blank" rel="noreferrer" aria-label="Live demo"><ArrowUpRight size={14}/></a>}</div></div></div></div>)}</div><div className="portfolio-about" id="p-about"><div><span>01 / A LITTLE ABOUT ME</span><h3>Curious by nature.<br/><em>{title.toLowerCase()} by craft.</em></h3></div><div><p>{p.about||'A little about you goes here. What do you care about? What kind of problems do you love solving?'}</p><div className="preview-skills">{(p.skills.length?p.skills:['Your skills','Your tools','Your strengths']).map(s=><span key={s}>{s}</span>)}</div><div className="preview-socials">{p.github&&<a href={safeLink(p.github)} target="_blank" rel="noreferrer"><Github size={13}/> GitHub <ArrowUpRight size={11}/></a>}{p.linkedin&&<a href={safeLink(p.linkedin)} target="_blank" rel="noreferrer"><Linkedin size={13}/> LinkedIn <ArrowUpRight size={11}/></a>}{p.email&&<a href={`mailto:${p.email}`}><Mail size={13}/> Say hello <ArrowUpRight size={11}/></a>}</div></div></div><div className="portfolio-footer"><span>© {new Date().getFullYear()} {name} · Made with intention.</span><a href="#workspace">Back to top ↑</a></div></div></div>}
function Feature({icon,number,title,copy}:{icon:any;number:string;title:string;copy:string}){return <div className="feature-card"><div className="feature-top">{icon}<span>{number}</span></div><h3>{title}</h3><p>{copy}</p><ArrowUpRight size={15} className="feature-arrow"/></div>}
function Step({n,title,copy,icon}:{n:string;title:string;copy:string;icon:any}){return <div className="step"><div className="step-icon">{icon}<span>{n}</span></div><h3>{title}</h3><p>{copy}</p><ArrowDown className="step-arrow" size={16}/></div>}
function localFallback(text:string,p:Profile,section?:string):Profile {if(section&&!text.trim())return p;const t=text||starter;const sentences=t.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);if(section){const key=section==='Hero'?'intro':section==='About'?'about':section==='Skills'?'skills':section==='Contact'?'email':null;if(key==='skills')return {...p,skills:[...new Set([...p.skills,...(t.match(/\b(React|TypeScript|JavaScript|Python|Node\.js|Figma|Next\.js|CSS|HTML|SQL)\b/gi)||[])])]};if(key)return {...p,[key]:sentences.join('. ') + (sentences.length?'.':'')}}return {...p,intro:sentences[0]||p.intro,about:sentences.slice(1,3).join('. ')+(sentences.length>1?'.':'' )||p.about,skills:p.skills.length?p.skills:(t.match(/\b(React|TypeScript|JavaScript|Python|Node\.js|Figma|Next\.js|CSS|HTML|SQL)\b/gi)||[]),projects:p.projects}}
type APIResponse = { profile: Profile; repaired?: boolean };
async function readApiResponse(response:Response):Promise<APIResponse>{
 const body=await response.text();
 let payload:unknown;
 try{payload=JSON.parse(body)}catch{
  const message=body.trim()?`The AI service returned an unreadable response (HTTP ${response.status}).`:`The AI service returned an empty response (HTTP ${response.status}).`;
  throw new Error(message);
 }
 if(!payload||typeof payload!=='object')throw new Error('The AI service returned an invalid response.');
 const result=payload as Record<string,unknown>;
 if(!response.ok){
  const nested=result.error&&typeof result.error==='object'?(result.error as Record<string,unknown>):undefined;
  const message=typeof nested?.message==='string'?nested.message:typeof result.detail==='string'?result.detail:`The AI service could not complete the request (HTTP ${response.status}).`;
  throw new Error(message);
 }
 return result as unknown as APIResponse;
}
function isProfileShape(value:unknown):value is Profile{
 if(!value||typeof value!=='object')return false;
 const p=value as Record<string,unknown>;
 const strings=['name','role','location','email','intro','about','experience','education','achievements','certifications','github','linkedin'];
 if(strings.some(key=>typeof p[key]!=='string'))return false;
 if(!Array.isArray(p.skills)||!p.skills.every(skill=>typeof skill==='string'))return false;
 if(!Array.isArray(p.projects))return false;
 return p.projects.every(project=>{
  if(!project||typeof project!=='object')return false;
  const item=project as Record<string,unknown>;
  return ['name','description','github','demo'].every(key=>typeof item[key]==='string')&&Array.isArray(item.stack)&&item.stack.every(skill=>typeof skill==='string');
 });
}
function safeLink(value:string){try{const url=new URL(value);return url.protocol==='https:'||url.protocol==='http:'?url.href:'#'}catch{return '#'}}
function slug(s:string){return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}
function zipFiles(files:Record<string,string>):Uint8Array{const encoder=new TextEncoder();const crc=(bytes:Uint8Array)=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0};const locals:Uint8Array[]=[];const centrals:Uint8Array[]=[];let offset=0;for(const[name,content]of Object.entries(files)){const file=encoder.encode(name),data=encoder.encode(content),sum=crc(data);const local=new Uint8Array(30+file.length+data.length),lv=new DataView(local.buffer);lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x800,true);lv.setUint16(8,0,true);lv.setUint32(14,sum,true);lv.setUint32(18,data.length,true);lv.setUint32(22,data.length,true);lv.setUint16(26,file.length,true);local.set(file,30);local.set(data,30+file.length);locals.push(local);const central=new Uint8Array(46+file.length),cv=new DataView(central.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(10,0,true);cv.setUint32(16,sum,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,file.length,true);cv.setUint32(42,offset,true);central.set(file,46);centrals.push(central);offset+=local.length}const centralSize=centrals.reduce((n,x)=>n+x.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,centrals.length,true);ev.setUint16(10,centrals.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);const all=new Uint8Array(offset+centralSize+end.length);let pos=0;for(const part of [...locals,...centrals,end]){all.set(part,pos);pos+=part.length}return all}
function exportHtml(p:Profile,t:string,c:string){const h=(s:string)=>s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]!));return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${h(p.name||'Portfolio')} — ${h(p.role||'Developer')}</title><meta name="description" content="${h(p.intro||'Developer portfolio')}"><style>*{box-sizing:border-box}body{margin:0;background:#f8faf7;color:#1b2420;font:16px/1.65 'DM Sans',Arial,sans-serif}main{max-width:900px;margin:auto;padding:64px 24px}a{color:inherit}header,footer{display:flex;justify-content:space-between;padding:24px max(calc((100vw - 900px)/2),24px);border-bottom:1px solid #e1e7e2}header b{color:${c}}.tag{color:${c};font-size:12px;letter-spacing:.12em}.hero{padding:80px 0 70px}.hero h1{font-size:clamp(42px,8vw,80px);line-height:1.04;letter-spacing:-.06em;margin:18px 0}.hero p{max-width:620px;color:#65716a;font-size:18px}.work{border-top:1px solid #dce3dd;padding:38px 0}.work h2{letter-spacing:-.04em}.skills span{display:inline-block;margin:5px;padding:7px 12px;border:1px solid #dce3dd;border-radius:20px}.contact{margin-top:56px;padding:32px;background:#e9f0e9;border-radius:18px}</style><header><strong>${h(p.name||'Your name')}<b>.</b></strong><span>${h(p.role||'Developer')}</span></header><main><section class="hero"><div class="tag">${h(p.location||'DEVELOPER')}</div><h1>${h(p.intro||`Hello, I'm ${p.name||'Your name'}.`)}</h1><p>${h(p.about||'A little about me…')}</p></section><section class="work"><div class="tag">SELECTED WORK</div>${p.projects.map(x=>`<article><h2>${h(x.name)}</h2><p>${h(x.description)}</p><div class="skills">${x.stack.map(a=>`<span>${h(a)}</span>`).join(' ')}</div><p>${x.github?`<a href="${h(safeLink(x.github))}">GitHub ↗</a> `:''}${x.demo?`<a href="${h(safeLink(x.demo))}">Live demo ↗</a>`:''}</p></article>`).join('')}</section><section class="work"><div class="tag">SKILLS</div><p class="skills">${p.skills.map(s=>`<span>${h(s)}</span>`).join(' ')}</p></section><section class="work"><div class="tag">EXPERIENCE & EDUCATION</div><p>${h(p.experience||'')}</p><p>${h(p.education||'')}</p></section><section class="work"><div class="tag">ACHIEVEMENTS & CERTIFICATIONS</div><p>${h(p.achievements||'')}</p><p>${h(p.certifications||'')}</p></section><section class="contact"><h2>Have a good one in mind?</h2><a href="mailto:${h(p.email)}">${h(p.email||'Get in touch')} ↗</a></section></main><footer><span>© ${new Date().getFullYear()} ${h(p.name||'')}</span><span>${h(t)} · PortfolioPilot AI</span></footer></html>`}
