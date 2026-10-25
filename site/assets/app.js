for(const b of document.querySelectorAll('[data-filter]'))b.addEventListener('click',()=>{
 const key=b.dataset.filter;let count=0;
 for(const p of document.querySelectorAll('[data-kind]')){p.hidden=key!=='all'&&p.dataset.kind!==key;if(!p.hidden)count++;}
 for(const button of document.querySelectorAll('[data-filter]'))button.setAttribute('aria-pressed',String(button===b));
 document.getElementById('filter-status').textContent='显示'+count+'个项目';
});
for(const b of document.querySelectorAll('[data-copy]'))b.addEventListener('click',async()=>{
 const text=document.getElementById(b.dataset.copy).textContent,status=b.closest('.start-card').querySelector('.copy-status');
 try{await navigator.clipboard.writeText(text);status.textContent='已复制，粘贴给你的 Agent 即可。';}catch{status.textContent='当前浏览器无法自动复制，请选中上方文字复制。';}
});

