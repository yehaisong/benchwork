(function(){
const D2R=Math.PI/180;
/* ---------- formatting ---------- */
let units='in';
function fracIn(v){const s=v<0?'-':'';v=Math.abs(v);let w=Math.floor(v),f=Math.round((v-w)*16);if(f===16){w++;f=0}
  if(!f)return s+w+'"';let n=f,d=16;while(n%2===0){n/=2;d/=2}return s+(w?w+' ':'')+n+'/'+d+'"';}
function fmt(v){return units==='cm'?(v*2.54).toFixed(1)+' cm':fracIn(v)}
function toDisp(v,p){return p.unit==='deg'?v:(units==='cm'?+(v*2.54).toFixed(1):+v.toFixed(3))}
function fromDisp(v,p){return p.unit==='deg'?v:(units==='cm'?v/2.54:v)}

/* ---------- templates ---------- */
// Locker shoe storage: the bottom shelf sits on 2x3 cleats at the floor; an optional second shelf is centred so both tiers get the same clearance.
function lockerShoes(p){const t=p.t,c=t+2.5,y1=c,top=p.seat-c,two=p.shoes==='2',y2=(y1+c+top)/2;
  return {two,y2,clear:two?top-y2:top-y1,need:3*c+10};}
const LUMBER={'2x3':'1 1/2" × 2 1/2"','2x4':'1 1/2" × 3 1/2"','1x12':'3/4" × 11 1/4"'};
// Per 8 ft stick: rough price, and the screw used to fasten it.
const STOCK={'2x3':{price:4,screw:'2 1/2"'},'2x4':{price:5,screw:'3"'},'1x12':{price:25,screw:'2"'}},SCREW_PRICE={'3"':.1,'2 1/2"':.08,'2"':.06};
const TEMPLATES={
 footrest:{name:'Sloped footrest',context:'floor',fitKind:'height',
  params:[
   {k:'width',label:'Width',v:20,min:12,max:36,step:.25},
   {k:'depth',label:'Depth',v:12,min:8,max:20,step:.25},
   {k:'height',label:'Average height',v:14,min:6,max:22,step:.25},
   {k:'tilt',label:'Tilt toward you',v:12,min:0,max:25,step:1,unit:'deg'},
   {k:'stretch',label:'Front stretcher height',v:4,min:2,max:6,step:.25},
   {k:'t',label:'Material thickness',v:.75,min:.25,max:1.5,step:.125}],
  build(p){
   const t=p.t,a=p.tilt*D2R,D=p.depth,W=p.width,rise=D*Math.tan(a);
   const tv=t/Math.cos(a);
   const hf=p.height-rise/2-tv, hb=p.height+rise/2-tv;
   const topLen=D/Math.cos(a), bp=hb-t*Math.tan(a), warns=[];
   if(hf<p.stretch+1)warns.push('The front of the sides is barely taller than the stretcher. Lower the stretcher or raise the height.');
   if(hf<3)warns.push('The front edge is very low. Reduce the tilt or raise the height.');
   const parts=[
    {id:'top',name:'Top',type:'box',size:[W,t,topLen],pos:[0,(hf+hb)/2+Math.cos(a)*t/2,Math.sin(a)*t/2],rotX:a,
     cut:{L:W,W:topLen,note:p.tilt?'Optionally bevel the back edge '+p.tilt+'°':''}},
    {id:'sideL',name:'Side',type:'trap',D,hf,hb,t,pos:[-(W/2-t/2),0,0],
     cut:{L:D,W:hb,note:'Trapezoid: '+fmt(hf)+' tall at front, '+fmt(hb)+' at back'}},
    {id:'sideR',name:'Side',type:'trap',D,hf,hb,t,pos:[(W/2-t/2),0,0],
     cut:{L:D,W:hb,note:'Trapezoid: '+fmt(hf)+' tall at front, '+fmt(hb)+' at back'}},
    {id:'back',name:'Back panel',type:'box',size:[W-2*t,bp,t],pos:[0,bp/2,-D/2+t/2],cut:{L:W-2*t,W:bp,note:'Fits between the sides'}},
    {id:'stretch',name:'Front stretcher',type:'box',size:[W-2*t,p.stretch,t],pos:[0,p.stretch/2,D/2-t/2],cut:{L:W-2*t,W:p.stretch,note:'At floor level, front edge'}}];
   return {parts,warns,t,summary:'Top surface runs from '+fmt(p.height-rise/2)+' at the front to '+fmt(p.height+rise/2)+' at the back.'};
  },
  steps:p=>[
   'Mark the two sides on your sheet: '+fmt(p.depth)+' along the bottom edge, then the front and back heights from the cut list. Join the top corners with a straight line and cut both sides together so they match.',
   'Rip the back panel and front stretcher to the sizes in the cut list.',
   'Dry-fit everything. Then glue and screw the back panel between the sides, flush with the back edges, using 1 1/4" screws.',
   'Glue and screw the front stretcher between the sides at floor level, flush with the front edges.',
   'Set the top on the sloped edges with an even overhang on both sides and fasten it down into the side edges.',
   'Break the sharp edges, sand, and finish. Add rubber feet underneath and grip tape or a rubber mat on top.'],
  stages:[{cut:['side']},{cut:['back','stretch']},{add:['side','back']},{add:['stretch']},{add:['top']},null]},
 frame23:{name:'2x3 frame with shelf',context:'floor',fitKind:'height',
  params:[
   {k:'width',label:'Width',v:20,min:12,max:36,step:.25},
   {k:'depth',label:'Depth',v:12,min:8,max:20,step:.25},
   {k:'height',label:'Average height',v:14,min:6,max:30,step:.25},
   {k:'slope',label:'Slope toward you',type:'select',v:'5',opts:[['0','Flat'],['6','1 in 6 (9.5°)'],['5','1 in 5 (11.3°)'],['4','1 in 4 (14°)'],['3','1 in 3 (18.4°)']]},
   {k:'shelf',label:'Middle board height',v:6,min:4,max:20,step:.25},
   {k:'t',label:'Board thickness',v:.75,min:.5,max:1.5,step:.125}],
  build(p){
   // 2x3 actual size is 1.5" x 2.5"; legs are 1.5 wide (x) by 2.5 deep (z). Front is +z.
   // The slope is a rise-over-run ratio so every angled cut is laid out with a ruler and square, then cut with a hand saw.
   const a=1.5,b=2.5,W=p.width,D=p.depth,H=p.height,t=p.t,run=+p.slope,tn=run?1/run:0,ang=Math.atan(tn),warns=[];
   const deg=(ang/D2R).toFixed(1)+'°',drop=fmt(b*tn),mark=' Mark it with a square: drop '+drop+' across the 2 1/2" face and saw to the line.';
   const yu=z=>H-t/Math.cos(ang)-z*tn; // underside of the top board
   const lx=W/2-a/2,lz=D/2-b/2,longL=W-2*a,sideL=D-2*b,bev=run?' Angle the top to the slope.'+mark:'';
   const hiF=yu(D/2),topMax=Math.min(hiF-b,yu(D/2-b)-b/Math.cos(ang))-.5;
   const sh=Math.max(t+b,Math.min(p.shelf,topMax)),ry=sh-t-b/2;
   if(topMax<t+b)warns.push('The front is too low to fit a middle board under the top rails. Pick a gentler slope or raise the height.');
   else if(sh!==p.shelf)warns.push('The middle board was moved to '+fmt(sh)+' so its rails fit between the floor and the top rails.');
   const lumber=(L,note)=>({L,W:b,stock:'2x3',note});
   const parts=[{id:'top',name:'Top board',type:'box',size:[W,t,D/Math.cos(ang)],pos:[0,yu(0)+Math.cos(ang)*t/2,Math.sin(ang)*t/2],rotX:ang,
     cut:{L:W,W:D/Math.cos(ang),note:'Flush with the frame'}},
    {id:'mid',name:'Middle board',type:'box',size:[longL,t,D],pos:[0,sh-t/2,0],cut:{L:longL,W:D,note:'Sits on the lower front and back rails, between the legs'}}];
   // Sloped parts are profiles in the side (z,y) plane extruded w along x, with tops that follow the underside of the top.
   const prof=(id,name,x,w,pts,cut)=>{const zs=pts.map(q=>q[0]),ys=pts.map(q=>q[1]),cz=(Math.min(...zs)+Math.max(...zs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
     return {id,name,type:'prof',w,pts:pts.map(([z,y])=>[z-cz,y-cy]),pos:[x,cy,cz],cut}};
   const under=(z0,z1,low)=>[[z0,low(z0)],[z1,low(z1)],[z1,yu(z1)],[z0,yu(z0)]];
   [[D/2-b,'Front'],[-D/2,'Back']].forEach(([z0,lab])=>[-1,1].forEach(sx=>parts.push(prof('leg'+lab+sx,lab+' leg',sx*lx,a,under(z0,z0+b,()=>0),
     lumber(yu(z0),run?'Long side; short side is '+fmt(yu(z0+b))+'.'+bev:'')))));
   // Long rails stay square (no bevel rip, which is hard by hand); they sit just under the slope and only stiffen the frame.
   [[D/2,'Front'],[-D/2+a,'Back']].forEach(([zl,lab],i)=>{const top=yu(zl);parts.push({id:'ulong'+i,name:lab+' upper rail',type:'box',size:[longL,b,a],pos:[0,top-b/2,zl-a/2],
     cut:lumber(longL,'Between the legs, flush with the outside, top at '+fmt(top)+'.'+(run?' Square cut, no bevel: it sits just under the sloped top.':''))})});
   [-1,1].forEach(s=>parts.push(prof('uside'+s,'Upper side rail',s*lx,a,under(-sideL/2,sideL/2,z=>yu(z)-b/Math.cos(ang)),
     lumber(sideL/Math.cos(ang),run?'Measured along an edge. Both ends are parallel angled cuts so they sit plumb against the legs: square a line across, then move one end of it '+drop+' along the edge.':'Between front and back legs, flush with the leg tops'))));
   [-1,1].forEach(s=>parts.push({id:'llong'+s,name:'Lower long rail',type:'box',size:[longL,b,a],pos:[0,ry,s*(D/2-a/2)],cut:lumber(longL,'Between the legs, flush with the outside')}));
   [-1,1].forEach(s=>parts.push({id:'lside'+s,name:'Lower side rail',type:'box',size:[a,b,sideL],pos:[s*lx,ry,0],cut:lumber(sideL,'Between front and back legs')}));
   if(W>30)warns.push('A wide span on 3/4" boards can flex. Add a center rail under each board.');
   const front=H-D/2*tn,back=H+D/2*tn;
   return {parts,warns,t,summary:run?'Top slopes '+deg+' (1 in '+run+'), from '+fmt(front)+' at the front to '+fmt(back)+' at the back. Every angled cut is a '+drop+' drop across the 2 1/2" face, marked with a ruler and square. Middle board at '+fmt(sh)+'.':'2x3 frame with the top at '+fmt(H)+' and the middle board at '+fmt(sh)+'.'};
  },
  steps:p=>[
   'Cut the four legs and eight rails from 2x3 to the cut list lengths. Cut the top and middle boards from '+fmt(p.t)+' stock.'+(+p.slope?' The back legs are taller than the front legs. For each leg top and both ends of the upper side rails, mark a '+fmt(2.5/+p.slope)+' drop across the 2 1/2" face with a square and cut to the line with a hand saw. No protractor or miter saw needed.':''),
   'Build the two side frames: screw a lower side rail and the '+(+p.slope?'sloped ':'')+'upper side rail between a front and a back leg, using 3" screws or pocket screws. Keep the top of the upper rail flush with the leg tops.',
   'Join the side frames with the long rails, front and back, flush with the outside faces. Check that the frame is square by measuring the diagonals.',
   'Drop the middle board onto the lower long rails and screw down through it into the rails.',
   (+p.slope?'Lay the top board on the sloped side rails and screw it down into them and the leg tops':'Screw the top board down into the upper rails')+', countersinking the screws.',
   'Ease the edges, sand, and finish. Add rubber feet under the legs'+(+p.slope?' and grip tape or a rubber mat on top.':'.')],
  stages:[{cut:['leg','ulong','uside','llong','lside','top','mid']},{add:['leg','uside','lside']},{add:['ulong','llong']},{add:['mid']},{add:['top']},null]},
 flipbox:{name:'Flip box (three heights)',context:'floor',fitKind:'flip',
  params:[
   {k:'length',label:'Length',v:18,min:10,max:30,step:.25},
   {k:'width',label:'Width',v:14,min:8,max:24,step:.25},
   {k:'height',label:'Height',v:10,min:4,max:18,step:.25},
   {k:'rest',label:'Resting on',type:'select',v:'flat',opts:[['flat','Flat (lowest)'],['edge','On its side (middle)'],['end','On its end (tallest)']]},
   {k:'t',label:'Material thickness',v:.75,min:.25,max:1.5,step:.125}],
  build(p){
   const L=p.length,W=p.width,H=p.height,t=p.t;
   const parts=[
    {id:'top',name:'Top and bottom',type:'box',size:[L,t,W],pos:[0,H-t/2,0],cut:{L,W,note:''}},
    {id:'bot',name:'Top and bottom',type:'box',size:[L,t,W],pos:[0,t/2,0],cut:{L,W,note:''}},
    {id:'sf',name:'Long side',type:'box',size:[L,H-2*t,t],pos:[0,H/2,W/2-t/2],cut:{L,W:H-2*t,note:'Optional hand hole'}},
    {id:'sb',name:'Long side',type:'box',size:[L,H-2*t,t],pos:[0,H/2,-W/2+t/2],cut:{L,W:H-2*t,note:'Optional hand hole'}},
    {id:'e1',name:'End',type:'box',size:[t,H-2*t,W-2*t],pos:[-L/2+t/2,H/2,0],cut:{L:W-2*t,W:H-2*t,note:''}},
    {id:'e2',name:'End',type:'box',size:[t,H-2*t,W-2*t],pos:[L/2-t/2,H/2,0],cut:{L:W-2*t,W:H-2*t,note:''}}];
   const rot=p.rest==='edge'?{x:Math.PI/2}:p.rest==='end'?{z:Math.PI/2}:{};
   return {parts,rot,warns:[],t,summary:'Heights available: '+fmt(H)+' flat, '+fmt(W)+' on its side, '+fmt(L)+' on its end.'};
  },
  steps:p=>[
   'Cut the top, bottom, two long sides and two ends to the cut list sizes.',
   'Drill a hand hole in each long side if you want one (a row of 1" holes joined with a jigsaw works).',
   'Glue and screw the ends between the long sides to make a frame.',
   'Glue and screw the top and bottom onto the frame. Every face is a working surface, so countersink all screws.',
   'Round the edges, sand, and finish. Add a grip pad to whichever face you use most.'],
  stages:[{cut:['top','bot','sf','sb','e1','e2']},{cut:['sf','sb']},{add:['sf','sb','e1','e2']},{add:['top','bot']},null]},
 riser:{name:'Desk riser shelf',context:'table',fitKind:null,
  params:[
   {k:'width',label:'Width',v:24,min:12,max:48,step:.25},
   {k:'depth',label:'Depth',v:10,min:6,max:16,step:.25},
   {k:'height',label:'Height',v:5,min:2,max:12,step:.25},
   {k:'inset',label:'Leg inset from ends',v:1,min:0,max:4,step:.25},
   {k:'back',label:'Back stretcher',type:'select',v:'yes',opts:[['yes','Yes'],['no','No']]},
   {k:'t',label:'Material thickness',v:.75,min:.25,max:1.5,step:.125}],
  build(p){
   const W=p.width,D=p.depth,H=p.height,t=p.t,lx=W/2-p.inset-t/2,lh=H-t;
   const parts=[
    {id:'top',name:'Top',type:'box',size:[W,t,D],pos:[0,H-t/2,0],cut:{L:W,W:D,note:''}},
    {id:'l1',name:'Leg',type:'box',size:[t,lh,D],pos:[-lx,lh/2,0],cut:{L:D,W:lh,note:''}},
    {id:'l2',name:'Leg',type:'box',size:[t,lh,D],pos:[lx,lh/2,0],cut:{L:D,W:lh,note:''}}];
   const warns=[];
   if(p.back==='yes'){const bh=Math.min(2.5,lh-.5),bw=2*lx-t;
     parts.push({id:'bs',name:'Back stretcher',type:'box',size:[bw,bh,t],pos:[0,lh-bh/2,-D/2+t/2],cut:{L:bw,W:bh,note:'Under the top, between the legs'}});}
   if(W>36&&t<.75)warns.push('A long, thin top will sag. Use thicker material or add a center leg.');
   return {parts,warns,t,summary:'Raises a monitor or laptop '+fmt(H)+' above the tabletop.'};
  },
  steps:p=>[
   'Cut the top, two legs'+(p.back==='yes'?', and the back stretcher':'')+' to the cut list sizes.',
   'Mark the leg positions on the underside of the top, '+fmt(p.inset)+' in from each end.',
   p.back==='yes'?'Glue and screw the back stretcher between the legs, flush with their top and back edges.':'Square each leg to the top with a clamp and a square.',
   'Glue and screw the top down onto the legs from above, countersinking the screws.',
   'Sand, finish, and add felt pads under the legs so it doesn’t scratch the table.'],
  stages:[{cut:['top','l1','l2','bs']},{cut:['top']},{add:['l1','l2','bs']},{add:['top']},null]},
 locker:{name:'Mudroom locker',context:'wall',fitKind:null,
  params:[
   {k:'people',label:'Bays',type:'select',v:'3',opts:[['2','2 people'],['3','3 people'],['4','4 people']]},
   {k:'bay',label:'Bay width',v:22,min:16,max:30,step:.25},
   {k:'height',label:'Overall height',v:78,min:60,max:90,step:.5},
   {k:'depth',label:'Depth',v:16,min:12,max:20,step:.25},
   {k:'seat',label:'Bench height',v:18,min:15,max:21,step:.25},
   {k:'shoes',label:'Shoe shelves',type:'select',v:'2',opts:[['1','One, at the bottom'],['2','Two: bottom and middle']]},
   {k:'hook',label:'Hook rail height',v:56,min:40,max:70,step:.5},
   {k:'cubby',label:'Cubby height',v:12,min:8,max:16,step:.25},
   {k:'t',label:'Plywood thickness',v:.75,min:.5,max:1,step:.125}],
  build(p){
   // Plywood sides, dividers and shelves; 2x3 cleats carry the shelves and 2x3 rails at the back anchor to the wall. Every cut is square.
   const a=1.5,b=2.5,N=+p.people,B=p.bay,H=p.height,D=p.depth,t=p.t,S=p.seat,c=p.cubby,W=N*B+(N+1)*t,warns=[];
   const lumber=(L,note)=>({L,W:b,stock:'2x3',note}),ph=H-t,cubTop=ph-c,hookY=p.hook;
   const sh=lockerShoes(p);
   const parts=[{id:'top',name:'Top',type:'box',size:[W,t,D],pos:[0,H-t/2,0],cut:{L:W,W:D,note:'Sits on the side panels and dividers'}}];
   for(let i=0;i<=N;i++){const end=i===0||i===N;
     parts.push({id:'pan'+i,name:end?'Side panel':'Divider',type:'box',size:[t,ph,D],pos:[-W/2+t/2+i*(B+t),ph/2,0],
       cut:{L:ph,W:D,note:end?'Cleats on the inside face':'Cleats on both faces'}});}
   const shelf=(id,name,y,note)=>{parts.push({id,name,type:'box',size:[B,t,D],pos:[xc,y-t/2,0],cut:{L:B,W:D,note}});
     [-1,1].forEach(s=>parts.push({id:'cl'+id+s,name:'Cleat',type:'box',size:[a,b,D],pos:[xc+s*(B/2-a/2),y-t-b/2,0],cut:lumber(D,'Screwed to the panel under a shelf')}))};
   let xc;
   for(let j=0;j<N;j++){xc=-W/2+t+B/2+j*(B+t);
     shelf('shoe'+j,'Shoe shelf',b+t,'Keeps boots off the floor');
     if(sh.two)shelf('shoe2'+j,'Upper shoe shelf',sh.y2,'Halfway between the bottom shoe shelf and the bench');
     shelf('seat'+j,'Bench seat',S,'');
     shelf('cub'+j,'Cubby shelf',cubTop,'Bins go in the cubby above');
     parts.push({id:'hr'+j,name:'Hook rail',type:'box',size:[B,b,a],pos:[xc,hookY,-D/2+a/2],cut:lumber(B,'Screw into a wall stud')});
     parts.push({id:'ar'+j,name:'Top wall rail',type:'box',size:[B,b,a],pos:[xc,ph-b/2,-D/2+a/2],cut:lumber(B,'Under the top at the back. Screw into a wall stud')});
     [-1,1].forEach(s=>parts.push({id:'hk'+j+s,name:'Coat hook',type:'box',size:[.75,3,2],pos:[xc+s*B/4,hookY,-D/2+a+1],cut:{L:0,W:0,hw:true,note:'Double coat hook, 2 per bay'}}));}
   if(hookY-S<30)warns.push('The hooks are close to the bench, so coats will hang onto the seat. Raise the hook rail or lower the bench.');
   if(cubTop-t-b<hookY+b/2+3)warns.push('The cubby shelf runs into the hook rail. Lower the hook rail or the cubby height, or make the locker taller.');
   if(!sh.two&&sh.clear<6)warns.push('The shoe space under the bench is very low. Raise the bench.');
   if(sh.two&&sh.clear<5)warns.push('Each shoe tier is only '+fmt(sh.clear)+' tall: fine for flats and sandals, tight for sneakers. Raise the bench to '+fmt(sh.need)+' for 5" tiers, or keep tall boots on the floor beside the locker.');
   return {parts,warns,t,summary:N+' bays, '+fmt(W)+' wide. Bench at '+fmt(S)+' with '+(sh.two?'two shoe shelves ('+fmt(sh.clear)+' clear on each tier)':'a shoe shelf ('+fmt(sh.clear)+' clear)')+' below, hooks at '+fmt(hookY)+', and a '+fmt(c)+' cubby for bins at the top. Screw the back rails into wall studs so it can’t tip.'};
  },
  steps:p=>[
   'Cut the plywood panels, top and shelves to the cut list. Most home centers will rip plywood to width for you, so you only crosscut by hand. Crosscut the 2x3 cleats and rails square.',
   'Lay each panel flat and mark the cleat lines with a square: the bottom of the panel, '+(lockerShoes(p).two?fmt(lockerShoes(p).y2-p.t)+' up for the upper shoe shelf, ':'')+fmt(p.seat-p.t)+' up for the bench, and '+fmt(p.height-2*p.t-p.cubby)+' up for the cubby shelf. Glue and screw the cleats below each line with 2 1/2" screws: inside face only on the two side panels, both faces on the dividers.',
   'Stand the panels up '+fmt(p.bay)+' apart and screw the top down onto them. Fit the hook rails and the top wall rails between the panels at the back, flush with the back edge.',
   'Drop in the shoe shelves, bench seats and cubby shelves and screw them down into the cleats.',
   'Push the locker against the wall, shim it level, and drive 3" screws through the hook rails and top wall rails into the wall studs.',
   'Screw two coat hooks to each hook rail. Add a lower hook for kids if you like.',
   'Ease the edges, sand, and paint or finish. A boot tray on each shoe shelf catches the wet.'],
  stages:[{cut:['top','pan','shoe','seat','cub','cl','hr','ar']},{add:['pan','cl']},{add:['top','hr','ar']},{add:['shoe','seat','cub']},{cut:['hr','ar']},{add:['hk']},null]},
 mudbench:{name:'Mudroom bench, hooks and shelf',context:'wall',fitKind:null,
  params:[
   {k:'people',label:'People',type:'select',v:'3',opts:[['2','2 people'],['3','3 people'],['4','4 people']]},
   {k:'width',label:'Width',v:66,min:36,max:90,step:.5},
   {k:'depth',label:'Bench depth',v:16,min:12,max:20,step:.25},
   {k:'seat',label:'Bench height',v:18,min:15,max:21,step:.25},
   {k:'hook',label:'Hook board height',v:60,min:48,max:70,step:.5},
   {k:'kids',label:'Lower hooks for kids',type:'select',v:'no',opts:[['no','No'],['yes','Yes, at 44"']]},
   {k:'shelf',label:'Shelf height',v:72,min:60,max:84,step:.5},
   {k:'sdepth',label:'Shelf depth',v:10,min:6,max:14,step:.25},
   {k:'t',label:'Board thickness',v:.75,min:.5,max:1,step:.125}],
  build(p){
   // A flat 2x3 bench (like the 2x3 frame) plus 2x3 hook boards and a shelf on a ledger, all screwed to wall studs. Square cuts only.
   const a=1.5,b=2.5,N=+p.people,W=p.width,Db=p.depth,S=p.seat,t=p.t,lh=S-t,warns=[];
   const zw=-Db/2,lx=W/2-a/2,lz=Db/2-b/2,longL=W-2*a,sideL=Db-2*b,shoeTop=b+t+.75,ry=shoeTop-t-b/2,mid=W>40;
   const lumber=(L,note)=>({L,W:b,stock:'2x3',note}),hw=note=>({L:0,W:0,hw:true,note});
   const parts=[{id:'top',name:'Bench seat',type:'box',size:[W,t,Db],pos:[0,S-t/2,0],cut:{L:W,W:Db,note:'Flush with the frame'}}];
   [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz],i)=>parts.push({id:'leg'+i,name:'Leg',type:'box',size:[a,lh,b],pos:[sx*lx,lh/2,sz*lz],cut:lumber(lh,'')}));
   // Long benches get a middle pair of legs, set just inside the long rails, and a cross rail between them.
   if(mid){const mz=Db/2-a-b/2;[-1,1].forEach(sz=>parts.push({id:'legM'+sz,name:'Leg',type:'box',size:[a,lh,b],pos:[0,lh/2,sz*mz],cut:lumber(lh,'Middle pair, inside the long rails')}));
     parts.push({id:'xr',name:'Middle cross rail',type:'box',size:[a,b,Db-2*a-2*b],pos:[0,lh-b/2,0],cut:lumber(Db-2*a-2*b,'Between the middle legs, under the seat')});}
   [['u',lh-b/2,'Upper'],['l',ry,'Lower']].forEach(([k,y,lab])=>{
    [-1,1].forEach(s=>parts.push({id:k+'long'+s,name:lab+' long rail',type:'box',size:[longL,b,a],pos:[0,y,s*(Db/2-a/2)],cut:lumber(longL,'Between the end legs, flush with the outside')}));
    [-1,1].forEach(s=>parts.push({id:k+'side'+s,name:lab+' side rail',type:'box',size:[a,b,sideL],pos:[s*lx,y,0],cut:lumber(sideL,'Between front and back legs')}));});
   const shoeL=mid?(longL-a)/2:longL;
   (mid?[-1,1]:[0]).forEach(s=>parts.push({id:'shoe'+s,name:'Shoe shelf',type:'box',size:[shoeL,t,Db],pos:[s*(a/2+shoeL/2),shoeTop-t/2,0],
     cut:{L:shoeL,W:Db,note:'Sits on the lower long rails'+(mid?', one each side of the middle legs':'')}}));
   const board=(id,name,y,count,note)=>{parts.push({id,name,type:'box',size:[W,b,a],pos:[0,y,zw+a/2],cut:lumber(W,note)});
     for(let k=0;k<count;k++)parts.push({id:'hk'+id+k,name:'Coat hook',type:'box',size:[.75,3,2],pos:[-W/2+(k+.5)*W/count,y,zw+a+1],cut:hw('Screwed to a hook board')});};
   board('hb','Hook board',p.hook,2*N,'Screw into every wall stud it crosses');
   if(p.kids==='yes')board('hbk','Kids hook board',44,N,'One hook per person. Screw into the wall studs');
   const sh=p.shelf,nb=W>48?3:2;
   parts.push({id:'led',name:'Shelf ledger',type:'box',size:[W,b,a],pos:[0,sh-t-b/2,zw+a/2],cut:lumber(W,'Under the shelf at the wall. Screw into every stud')});
   parts.push({id:'shelf',name:'Shelf',type:'box',size:[W,t,p.sdepth],pos:[0,sh-t/2,zw+p.sdepth/2],cut:{L:W,W:p.sdepth,note:'Rests on the ledger and brackets'}});
   for(let k=0;k<nb;k++)parts.push({id:'br'+k,name:'Shelf bracket',type:'box',size:[.75,5,p.sdepth-2],pos:[-W/2+3+k*(W-6)/(nb-1),sh-t-2.5,zw+a+(p.sdepth-2-a)/2],cut:hw((p.sdepth-2)+'" or so, into a stud')});
   if(p.hook-S<30)warns.push('The hooks are close to the bench, so coats will hang onto the seat. Raise the hook board.');
   if(sh-t-b<p.hook+b/2+6)warns.push('The shelf is close to the hooks, so bulky coats will hit it. Raise the shelf or lower the hooks.');
   return {parts,warns,t,summary:fmt(W)+' bench at '+fmt(S)+' with a shoe shelf below, '+(2*N)+' hooks at '+fmt(p.hook)+(p.kids==='yes'?' plus '+N+' at 44"':'')+', and a shelf at '+fmt(sh)+'. The bench is freestanding; the hook boards and shelf screw into wall studs.'};
  },
  steps:p=>[
   'Cut the 2x3 legs, rails, hook board'+(p.kids==='yes'?'s':'')+' and shelf ledger square to the cut list. Cut the bench seat, shoe shelf and shelf from '+fmt(p.t)+' boards or plywood.',
   'Build the two bench ends: screw an upper and a lower side rail between a front and a back leg with 2 1/2" screws, upper rail flush with the leg tops.',
   'Join the ends with the long rails, front and back, flush with the outside.'+(p.width>40?' Screw the middle legs inside the long rails and add the cross rail between them so the seat can’t sag.':'')+' Check the diagonals for square.',
   'Drop in the shoe shelf, then screw the seat down into the upper rails.',
   'Find the wall studs and draw a level line at '+fmt(p.hook)+'. Drive two 3" screws through the hook board into every stud.'+(p.kids==='yes'?' Do the same for the kids board at 44".':''),
   'Screw the shelf ledger into the studs with its top '+fmt(p.shelf-p.t)+' up, add the brackets, and screw the shelf down onto them.',
   'Screw on the coat hooks, '+2*+p.people+' evenly spaced.',
   'Sand, paint or finish, and slide the bench under the hooks. A boot tray on the shoe shelf catches the wet.'],
  stages:[{cut:['leg','ulong','uside','llong','lside','xr','top','shoe','hb','led','shelf']},{add:['leg','uside','lside']},{add:['ulong','llong','xr']},{add:['shoe','top']},{add:['hb']},{add:['led','br','shelf']},{add:['hk']},null]},
 worktable:{name:'Corner work table',context:'corner',fitKind:null,
  params:[
   {k:'length',label:'Length',v:84,min:72,max:96,step:.5},
   {k:'depth',label:'Depth',v:30,min:24,max:36,step:.25},
   {k:'height',label:'Height',v:41,min:30,max:44,step:.25},
   {k:'back',label:'Back support',type:'select',v:'legs',opts:[['legs','Legs on all four corners'],['wall','Wall ledgers, legs at the front only']]},
   {k:'layers',label:'Top',type:'select',v:'2',opts:[['1','One layer of plywood'],['2','Two layers, glued (stiffer)']]},
   {k:'shelf',label:'Lower shelf height',v:8,min:5,max:16,step:.25},
   {k:'t',label:'Plywood thickness',v:.75,min:.5,max:1,step:.125}],
  build(p){
   // 2x4 frame (1.5" x 3.5"), legs 1.5 wide (x) by 3.5 deep (z). Back wall is -z, side wall is -x. Square cuts only.
   const a=1.5,b=3.5,L=p.length,D=p.depth,H=p.height,t=p.t,nl=+p.layers,T=nl*t,lh=H-T,wall=p.back==='wall',warns=[];
   const lx=L/2-a/2,lz=D/2-b/2,longL=L-2*a,mid=L>72,shTop=p.shelf,ry=shTop-t-b/2;
   const lumber=(L,note)=>({L,W:b,stock:'2x4',note});
   const parts=[];
   for(let i=0;i<nl;i++)parts.push({id:'top'+i,name:'Top layer',type:'box',size:[L,t,D],pos:[0,H-T+t*(i+.5),0],
     cut:{L,W:D,note:nl>1?'Glue and screw the layers together from below':'Screw down into the aprons'}});
   (wall?[1]:[-1,1]).forEach(sz=>[-1,1].forEach(sx=>parts.push({id:'leg'+sz+sx,name:'Leg',type:'box',size:[a,lh,b],pos:[sx*lx,lh/2,sz*lz],cut:lumber(lh,'')})));
   if(mid)(wall?[1]:[-1,1]).forEach(sz=>parts.push({id:'mleg'+sz,name:'Middle leg',type:'box',size:[a,lh,b],pos:[0,lh/2,sz*(D/2-a-b/2)],cut:lumber(lh,'Inside the long rails, at the middle')}));
   // Front (and back) aprons and lower rails run between the end legs; in wall mode the back ones become ledgers screwed to the studs.
   [['u',lh-b/2,'apron','Apron'],['l',ry,'rail','Lower rail']].forEach(([k,y,w,lab])=>{
     parts.push({id:k+'long1',name:'Front '+w,type:'box',size:[longL,b,a],pos:[0,y,D/2-a/2],cut:lumber(longL,'Between the legs, flush with the front')});
     if(wall)parts.push({id:'wl'+k,name:(k==='u'?'Back':'Lower back')+' wall ledger',type:'box',size:[L,b,a],pos:[0,y,-D/2+a/2],cut:lumber(L,'Screw into every wall stud with two 3" screws')});
     else parts.push({id:k+'long0',name:'Back '+w,type:'box',size:[longL,b,a],pos:[0,y,-D/2+a/2],cut:lumber(longL,'Between the legs, flush with the back. Screw into a stud or two')});
     const sl=wall?D-b-a:D-2*b,sz=wall?(a-b)/2:0;
     [-1,1].forEach(s=>parts.push({id:k+'side'+s,name:(k==='u'?'Side apron':'Lower side rail'),type:'box',size:[a,b,sl],pos:[s*lx,y,sz],
       cut:lumber(sl,wall?'From the front leg back to the wall ledger':'Between front and back legs')}));});
   if(mid){const z0=-D/2+a,z1=D/2-a-b,zs=wall?z0:-(D/2-a-b),xl=z1-zs;
     parts.push({id:'xr',name:'Cross rail',type:'box',size:[a,b,xl],pos:[0,lh-b/2,(zs+z1)/2],cut:lumber(xl,'Under the middle of the top'+(wall?', from the middle leg to the wall ledger':', between the middle legs'))});}
   const shL=mid?(longL-a)/2:longL;
   (mid?[-1,1]:[0]).forEach(s=>parts.push({id:'shelf'+s,name:'Lower shelf',type:'box',size:[shL,t,D],pos:[s*(a/2+shL/2),shTop-t/2,0],
     cut:{L:shL,W:D,note:'Sits on the lower rails'+(mid?', one each side of the middle legs':'')}}));
   if(shTop+b>lh-b-6)warns.push('The lower shelf is too close to the top. Lower it.');
   return {parts,warns,t,summary:fmt(L)+' × '+fmt(D)+' top at '+fmt(H)+(wall?', carried by 2x4 ledgers on the back wall and legs at the front':' on four 2x4 legs')+(mid?' plus a middle leg'+(wall?'':' pair'):'')+'. Lower shelf at '+fmt(shTop)+'.'};
  },
  steps:p=>{const wall=p.back==='wall',mid=p.length>72,lh=p.height-p.layers*p.t;return [
   'Cut the 2x4 legs, aprons and rails square to the cut list. Cut the top'+(+p.layers>1?' layers':'')+' and lower shelf from '+fmt(p.t)+' plywood (the store can rip it to '+fmt(p.depth)+' wide).',
   ...(wall?[
   'Find the wall studs on the back wall. Draw level lines at '+fmt(lh)+' and '+fmt(p.shelf-p.t)+' and screw the two back ledgers under them, two 3" screws into every stud.',
   'Build the front: screw the front apron and the front lower rail between the two front legs'+(mid?', with the middle leg behind them at the center':'')+'. Use 3" screws or pocket screws.',
   'Stand the front up and join it to the wall ledgers with the side aprons and lower side rails'+(mid?', plus the cross rail from the middle leg':'')+'. Shim the feet until the top of the frame is level.']:[
   'Build the two ends: screw a side apron and a lower side rail between a front and a back leg, apron flush with the leg tops. Use 3" screws or pocket screws.',
   'Join the ends with the front and back aprons and lower rails'+(mid?'. Screw the middle legs inside the aprons and add the cross rail between them':'')+'. Check that the diagonals match.']),
   'Drop in the lower shelf and screw it down into the rails.',
   (+p.layers>1?'Screw the first top layer down into the aprons, then glue and screw the second layer onto it from below, edges flush.':'Screw the top down into the aprons, countersinking the screws.'),
   ...(wall?[]:['Slide the table into the corner, shim it level, and drive a couple of 3" screws through the back apron into a wall stud so it can’t rack.']),
   'Ease the edges and finish the top with a few coats of polyurethane or hardwax oil.']},
  stages:p=>{const wall=p.back==='wall';return [{cut:['top','leg','mleg','ulong','llong','uside','lside','xr','wl','shelf']},
   ...(wall?[{add:['wl']},{add:['leg','mleg','ulong1','llong1']},{add:['uside','lside','xr']}]:[{add:['leg-1','leg1','uside','lside']},{add:['ulong','llong','mleg','xr']}]),
   {add:['shelf']},{add:['top']},...(wall?[]:[{cut:['ulong0']}]),null]}},
 walltable:{name:'Wall-hung corner table (one leg)',context:'corner',fitKind:null,
  params:[
   {k:'length',label:'Length',v:84,min:48,max:96,step:.5},
   {k:'depth',label:'Depth',v:30,min:24,max:36,step:.25},
   {k:'height',label:'Height',v:41,min:30,max:44,step:.25},
   {k:'layers',label:'Top',type:'select',v:'2',opts:[['1','One layer of plywood'],['2','Two layers, glued (stiffer)']]},
   {k:'mid',label:'Middle shelf (half depth)',type:'select',v:'yes',opts:[['yes','Yes'],['no','No']]},
   {k:'midh',label:'Middle shelf height',v:20,min:10,max:30,step:.25},
   {k:'lower',label:'Lower shelf',type:'select',v:'no',opts:[['no','No (saves material)'],['yes','Yes']]},
   {k:'shelf',label:'Lower shelf height',v:8,min:5,max:16,step:.25},
   {k:'t',label:'Plywood thickness',v:.75,min:.5,max:1,step:.125}],
  build(p){
   // Same 2x4 stock as the corner work table. The back wall (-z) and side wall (-x) carry ledgers screwed to studs,
   // so the only leg is at the free front corner. A doubled front apron spans the full length without a middle leg.
   const a=1.5,b=3.5,L=p.length,D=p.depth,H=p.height,t=p.t,nl=+p.layers,T=nl*t,lh=H-T,lower=p.lower==='yes',warns=[];
   const lumber=(L,note)=>({L,W:b,stock:'2x4',note}),uy=lh-b/2,ry=p.shelf-t-b/2,lx=L/2-a/2;
   const parts=[];
   for(let i=0;i<nl;i++)parts.push({id:'top'+i,name:'Top layer',type:'box',size:[L,t,D],pos:[0,H-T+t*(i+.5),0],
     cut:{L,W:D,note:nl>1?'Glue and screw the layers together from below':'Screw down into the ledgers, apron and cross rails'}});
   const ledgers=(k,y,lab)=>{parts.push({id:'wl'+k+'b',name:(lab?lab+'back':'Back')+' wall ledger',type:'box',size:[L,b,a],pos:[0,y,-D/2+a/2],cut:lumber(L,'Two 3" screws into every stud')});
     parts.push({id:'wl'+k+'s',name:(lab?lab+'side':'Side')+' wall ledger',type:'box',size:[a,b,D-a],pos:[-L/2+a/2,y,a/2],cut:lumber(D-a,'Butts against the back ledger. Two 3" screws into every stud')});};
   ledgers('u',uy,'');
   parts.push({id:'leg',name:'Leg',type:'box',size:[a,lh,b],pos:[lx,lh/2,D/2-b/2],cut:lumber(lh,'The only leg, at the open front corner')});
   [0,1].forEach(i=>parts.push({id:'fa'+i,name:'Front apron',type:'box',size:[L-2*a,b,a],pos:[0,uy,D/2-a/2-i*a],
     cut:lumber(L-2*a,'Two glued and screwed together so the front spans without a middle leg. Left end: pocket screws or a steel angle into the side ledger')}));
   parts.push({id:'rs',name:'End apron',type:'box',size:[a,b,D-a-b],pos:[lx,uy,(a-b)/2],cut:lumber(D-a-b,'From the leg back to the back ledger')});
   const n=Math.max(1,Math.round(L/32)),xl=D-3*a;
   for(let k=1;k<=n;k++)parts.push({id:'xr'+k,name:'Cross rail',type:'box',size:[a,b,xl],pos:[-L/2+a+k*(L-2*a)/(n+1),uy,-a/2],
     cut:lumber(xl,'Between the back ledger and the front apron, about every '+fmt((L-2*a)/(n+1))+'. Pocket screws or joist hangers')});
   if(lower){ledgers('l',ry,'Lower ');
     parts.push({id:'lf',name:'Lower front rail',type:'box',size:[L-2*a,b,a],pos:[0,ry,D/2-a/2],cut:lumber(L-2*a,'From the side ledger to the leg')});
     parts.push({id:'lrs',name:'Lower end rail',type:'box',size:[a,b,D-a-b],pos:[lx,ry,(a-b)/2],cut:lumber(D-a-b,'From the leg back to the lower back ledger')});
     parts.push({id:'shelf',name:'Lower shelf',type:'box',size:[L-2*a,t,D],pos:[0,p.shelf-t/2,0],cut:{L:L-2*a,W:D,note:'Sits on the lower ledger and front rail'}});
     if(p.shelf+b>lh-b-6)warns.push('The lower shelf is too close to the top. Lower it.');}
   // Half-depth middle shelf along the back wall: a 2x4 ledger into the studs plus steel brackets, clear of the front leg.
   if(p.mid==='yes'){const mh=p.midh,md=D/2,nb=L>48?3:2;
     parts.push({id:'ml',name:'Middle shelf ledger',type:'box',size:[L,b,a],pos:[0,mh-t-b/2,-D/2+a/2],cut:lumber(L,'Under the middle shelf at the wall. Two 3" screws into every stud')});
     parts.push({id:'mshelf',name:'Middle shelf',type:'box',size:[L,t,md],pos:[0,mh-t/2,-D/2+md/2],cut:{L,W:md,note:'Half the table depth. Fits in the strip left over from a top sheet'}});
     for(let k=0;k<nb;k++)parts.push({id:'mbr'+k,name:'Shelf bracket',type:'box',size:[.75,6,md-a-1],pos:[-L/2+4+k*(L-8)/(nb-1),mh-t-3,-D/2+a+(md-a-1)/2],cut:{L:0,W:0,hw:true,note:fmt(md-2)+' or larger, screwed into a stud'}});
     if(mh>lh-b-10)warns.push('The middle shelf is close to the underside of the top, so there is little room above it. Lower it.');
     if(lower&&mh-p.shelf<10)warns.push('The middle shelf is close to the lower shelf. Raise it or lower the lower shelf.');}
   return {parts,warns,t,summary:fmt(L)+' × '+fmt(D)+' top at '+fmt(H)+' with one leg. Ledgers on both walls carry the back and left edges, so the walls must have studs to screw into. Same 2x4 and plywood as the corner work table, with fewer parts.'};
  },
  steps:p=>{const lh=p.height-p.layers*p.t,lower=p.lower==='yes';return [
   'Cut the 2x4 ledgers, leg, aprons and cross rails square to the cut list. Cut the top'+(+p.layers>1?' layers':'')+(p.mid==='yes'?', middle shelf':'')+(lower?' and lower shelf':'')+' from '+fmt(p.t)+' plywood.'+(p.mid==='yes'?' The middle shelf comes out of the strip left over beside a top layer.':''),
   'Find the studs on both walls. Draw level lines at '+fmt(lh)+(lower?' and '+fmt(p.shelf-p.t):'')+' around the corner and screw the ledgers under them: back wall first, then the side wall ledger butted against it. Two 3" screws into every stud.',
   'Glue and screw the two front aprons together. Screw the leg to the right end and the end apron between the leg and the back ledger. Lift the front into place, fasten its left end to the side ledger with pocket screws or a steel angle, and check that it is level.',
   'Fit the cross rails between the back ledger and the front apron with pocket screws or joist hangers.',
   ...(p.mid==='yes'?['Middle shelf: screw its ledger into the back-wall studs with the top at '+fmt(p.midh-p.t)+', add the brackets on studs, and screw the '+fmt(p.depth/2)+'-deep shelf down onto them.']:[]),
   ...(lower?['Add the lower front rail and lower end rail, then drop the lower shelf onto them.']:[]),
   (+p.layers>1?'Screw the first top layer down into the ledgers, apron and cross rails, then glue and screw the second layer onto it from below.':'Screw the top down into the ledgers, apron and cross rails, countersinking the screws.'),
   'Ease the edges and finish the top with a few coats of polyurethane or hardwax oil.']},
  stages:p=>[{cut:['top','wl','leg','fa','rs','xr','lf','lrs','shelf','ml','mshelf']},{add:['wl']},{add:['leg','fa','rs']},{add:['xr']},
   ...(p.mid==='yes'?[{add:['ml','mbr','mshelf']}]:[]),
   ...(p.lower==='yes'?[{add:['lf','lrs','shelf']}]:[]),{add:['top']},null]},
 vexfield:{name:'VEX V5 practice field',context:'none',fitKind:null,
  params:[
   {k:'size',label:'Field',type:'select',v:'half',opts:[['half','Half field (6 × 3 tiles)'],['full','Full field (6 × 6 tiles)']]},
   {k:'tile',label:'Tile size',v:24,min:23,max:24.5,step:.0625},
   {k:'tiles',label:'Foam tiles',type:'select',v:'yes',opts:[['yes','Include in the shopping list'],['no','I already have them']]},
   {k:'raise',label:'Raised platform (0 = on the floor)',v:0,min:0,max:40,step:.5}],
  build(p){
   // Walls are 1x12 boards (3/4" × 11 1/4") on edge around the tiles, split into sections of 8 ft or less so they come apart for storage.
   // Long walls run past the corners; 2x3 corner blocks sit outside the short walls; 2x3 splice blocks join sections.
   const a=1.5,b=2.5,t=.75,h=11.25,cols=6,rows=p.size==='full'?6:3,tl=p.tile,Li=cols*tl,Wi=rows*tl,warns=[];
   const board=(L,note)=>({L,W:h,stock:'1x12',note}),lumber=(L,note)=>({L,W:b,stock:'2x3',note}),parts=[];
   for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)parts.push({id:'tile'+r+'_'+c,name:'Foam field tile',type:'box',size:[tl-.08,.625,tl-.08],
     pos:[-Li/2+tl*(c+.5),.3125,-Wi/2+tl*(r+.5)],color:0x6d7680,cut:{L:0,W:0,hw:true,owned:p.tiles==='no',note:'VEX field tile or 2 ft interlocking foam mat'}});
   const wall=(id,name,len,axis,fixed,note)=>{const n=Math.ceil(len/96),sl=len/n;
     for(let k=0;k<n;k++){const c=-len/2+sl*(k+.5);
       parts.push({id:id+k,name,type:'box',size:axis==='x'?[sl,h,t]:[t,h,sl],pos:axis==='x'?[c,h/2,fixed]:[fixed,h/2,c],cut:board(sl,note+(n>1?' ('+n+' sections per wall)':''))});}
     for(let k=1;k<n;k++){const c=-len/2+sl*k,o=fixed+Math.sign(fixed)*(t/2+a/2);
       parts.push({id:'sp'+id+k,name:'Splice block',type:'box',size:axis==='x'?[b,h,a]:[a,h,b],pos:axis==='x'?[c,h/2,o]:[o,h/2,c],cut:lumber(h,'Behind each joint between sections, outside the field')});}};
   const Lw=Li+2*t+2*a;
   [-1,1].forEach(s=>wall('lw'+s+'_',s>0&&rows===3?'Long wall (centre line)':'Long wall',Lw,'x',s*(Wi/2+t/2),'Runs past the corners to cover the corner blocks'));
   [-1,1].forEach(s=>wall('sw'+s+'_','Short wall',Wi,'z',s*(Li/2+t/2),'Fits between the long walls'));
   [-1,1].forEach(sx=>[-1,1].forEach(sz=>parts.push({id:'cb'+sx+sz,name:'Corner block',type:'box',size:[a,h,b],pos:[sx*(Li/2+t+a/2),h/2,sz*(Wi/2-b/2)],
     cut:lumber(h,'Outside each corner: the short wall screws to its face, the long wall to its edge')})));
   // Optional raised platform: a 2x4 grid (beams along x every 4 ft or less, joists along z every 2 ft or less) on 2x4 legs,
   // decked with 3/4" plywood. The whole field sits on top.
   let lift=0;
   if(p.raise>0){const A=1.5,B=3.5,X=Lw,Z=Wi+2*t+2*a,top=Math.max(p.raise,t+B);lift=top;
     if(top>p.raise)warns.push('The platform frame needs at least '+fmt(t+B)+', so the field sits at '+fmt(top)+'.');
     parts.forEach(pt=>pt.pos[1]+=top);
     const two=(L,note)=>({L,W:B,stock:'2x4',note}),yb=top-t-B/2,lh=top-t-B;
     const nx=Math.ceil(X/96),nz=Math.ceil(Z/48),nzb=nz,m=nx*Math.ceil(X/nx/24),nl=Math.ceil((X-A)/48);
     const zb=[...Array(nzb+1)].map((_,j)=>-Z/2+A/2+j*(Z-A)/nzb),xk=[...Array(m+1)].map((_,k)=>-X/2+A/2+k*(X-A)/m);
     zb.forEach((z,j)=>parts.push({id:'plb'+j,name:j===0||j===nzb?'Platform rim':'Platform beam',type:'box',size:[X,B,A],pos:[0,yb,z],cut:two(X,'2x4 on edge along the length'+(X>96?'. Longer than 8 ft: butt two pieces over a leg':''))}));
     for(let j=0;j<nzb;j++){const len=zb[j+1]-zb[j]-A;
       xk.forEach((x,k)=>parts.push({id:'plj'+j+'_'+k,name:'Platform joist',type:'box',size:[A,B,len],pos:[x,yb,(zb[j]+zb[j+1])/2],cut:two(len,'Between beams, about every '+fmt((X-A)/m))}));}
     if(lh>0)zb.forEach((z,j)=>{for(let i=0;i<=nl;i++)parts.push({id:'pll'+j+'_'+i,name:'Platform leg',type:'box',size:[B,lh,A],pos:[-X/2+A/2+i*(X-A)/nl,lh/2,z],cut:two(lh,'Under the beams, about every '+fmt((X-A)/nl))});});
     for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)parts.push({id:'pd'+i+'_'+j,name:'Platform deck panel',type:'box',size:[X/nx,t,Z/nz],pos:[-X/2+X/nx*(i+.5),top-t/2,-Z/2+Z/nz*(j+.5)],
       cut:{L:X/nx,W:Z/nz,note:'3/4" plywood. Seams land on a joist or beam'}});
     if(lh>18)warns.push('At this height the legs can rack. Screw a diagonal 2x4 brace across each outside face, and keep the platform away from walls people walk past.');
     if(X>96)warns.push('The rims and beams are longer than 8 ft. Buy 12 ft 2x4s, or butt two pieces together over a leg.');}
   if(p.tile!==24)warns.push('Tiles are not 24", so the inside of the field is '+fmt(Li)+' × '+fmt(Wi)+'. Measure your tiles and match the official field drawings.');
   return {parts,warns,t,summary:(rows===3?'Half':'Full')+' field: '+cols+' × '+rows+' tiles, '+fmt(Li)+' × '+fmt(Wi)+' inside, with 1x12 walls '+fmt(h)+' tall'+(lift?', on a platform '+fmt(lift)+' high':'')+'. Check the current game manual for the exact perimeter size before cutting.'};
  },
  steps:p=>{const full=p.size==='full',up=p.raise>0;return [
   'Crosscut the 1x12 boards into the wall sections and the 2x3 into corner and splice blocks, all '+fmt(11.25)+' long.'+(up?' Cut the platform 2x4s and plywood deck panels to the cut list.':'')+' Every cut is square.',
   ...(up?['Build the platform frame upside down on the floor: screw the joists between the rims and beams with 3" screws, check the diagonals, then screw a leg under the beams at each marked spot. Flip it over, shim it level, and add diagonal braces if it is tall.',
     'Screw the plywood deck panels down onto the frame with 1 1/4" screws every 8", seams centred on the joists.']:[]),
   'Lay the foam tiles in a 6 × '+(full?6:3)+' grid on '+(up?'the deck':'a flat floor')+', pressing the edges together.',
   (full?'Join each pair of short-wall sections with a splice block on the outside. Then s':'S')+'crew a corner block to each end of the short walls, on the outside face, flush top and bottom. Use 2" screws.',
   'Join the long-wall sections with splice blocks on the outside, then stand them along the tiles and screw through each long wall into the edges of the corner blocks.',
   'Measure the inside both ways and the two diagonals. Nudge the walls until the diagonals match and the walls sit snug against the tiles.',
   'Sand the top edges and round the corners so nobody catches a hand. To store it, unscrew the corners and splices; the sections stack flat.',]},
  stages:p=>[{cut:['lw','sw','cb','sp','pl','pd']},...(p.raise>0?[{add:['pl']},{add:['pd']}]:[]),{add:['tile']},{add:['sw','cb']},{add:['lw','sp']},{cut:['lw','sw']},null]}
};

/* ---------- state ---------- */
// Saved designs: named snapshots of one project's settings, kept with the rest of the state and exportable as a JSON file.
function cleanSaves(list){return (Array.isArray(list)?list:[]).filter(v=>v&&TEMPLATES[v.tpl]&&v.params&&typeof v.params==='object'&&v.name)
  .map(v=>({id:String(v.id||Date.now()+Math.random()),name:String(v.name).slice(0,60),tpl:v.tpl,params:{...v.params},at:v.at||Date.now()}))}
const KEY='benchwork.v1';
let state={tpl:'footrest',units:'in',params:{},fit:{table:41,elbow:9.5,knee:17,thigh:6},ctx:true,dims:true,prices:{},saves:[]};
for(const k in TEMPLATES){state.params[k]={};TEMPLATES[k].params.forEach(p=>state.params[k][p.k]=p.v)}
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s){Object.assign(state.fit,s.fit||{});
  for(const k in s.params||{})if(state.params[k])Object.assign(state.params[k],s.params[k]);
  if(TEMPLATES[s.tpl])state.tpl=s.tpl;if(s.units)state.units=s.units;if('ctx'in s)state.ctx=s.ctx;if('dims'in s)state.dims=s.dims;Object.assign(state.prices,s.prices||{});state.saves=cleanSaves(s.saves);}}catch(e){}
units=state.units;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
function fitCalc(){const f=state.fit,seat=f.table-f.elbow,foot=seat-f.knee,clear=(f.table-1.25)-(seat+f.thigh);return{seat,foot,clear}}

/* ---------- three setup ---------- */
const vp=document.getElementById('vp'),canvas=document.getElementById('gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(35,1,.5,2000);
scene.add(new THREE.HemisphereLight(0xffffff,0x8a97a3,.85));
const sun=new THREE.DirectionalLight(0xffffff,.65);sun.position.set(30,70,45);scene.add(sun);
const fill=new THREE.DirectionalLight(0xffffff,.25);fill.position.set(-40,20,-30);scene.add(fill);
const gridMinor=new THREE.GridHelper(144,144),gridMajor=new THREE.GridHelper(144,12);
gridMinor.material.transparent=true;gridMinor.material.opacity=.6;scene.add(gridMinor,gridMajor);
const asm=new THREE.Group();scene.add(asm);
const ctxGroup=new THREE.Group();scene.add(ctxGroup);
const dimGroup=new THREE.Group();scene.add(dimGroup);
const edgeMat=new THREE.LineBasicMaterial({color:0x1c2730});
const dimMat=new THREE.LineBasicMaterial({color:0x2f5d8a});
const ctxMat=new THREE.MeshStandardMaterial({color:0x8a9aa6,transparent:true,opacity:.22,depthWrite:false});
const ctxEdge=new THREE.LineBasicMaterial({color:0x8a9aa6,transparent:true,opacity:.6});
function css(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()}
function applyTheme(){
  scene.background=new THREE.Color(css('--canvas'));
  gridMinor.material.color.set(css('--grid-minor'));gridMajor.material.color.set(css('--grid-major'));
  edgeMat.color.set(css('--ink'));dimMat.color.set(css('--accent'));
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme);

/* ---------- camera control ---------- */
const sph={theta:.75,phi:1.08,r:80},goal={theta:.75,phi:1.08,r:80};
const target=new THREE.Vector3(0,10,0),goalT=new THREE.Vector3(0,10,0);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function placeCam(){const s=Math.sin(sph.phi);
  camera.position.set(target.x+sph.r*s*Math.sin(sph.theta),target.y+sph.r*Math.cos(sph.phi),target.z+sph.r*s*Math.cos(sph.theta));
  camera.lookAt(target);}
const ptrs=new Map();let drag=null,pinch=null;
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),r:goal.r};drag=null;}
  else drag={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,pan:e.button===2||e.shiftKey};});
canvas.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&ptrs.size===2){const [a,b]=[...ptrs.values()];goal.r=Math.max(15,Math.min(400,pinch.r*pinch.d/Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))));return}
  if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
  if(drag.pan){const k=goal.r*.0016;const right=new THREE.Vector3().setFromMatrixColumn(camera.matrix,0),up=new THREE.Vector3().setFromMatrixColumn(camera.matrix,1);
    goalT.addScaledVector(right,-dx*k).addScaledVector(up,dy*k);}
  else{goal.theta-=dx*.008;goal.phi=Math.max(.02,Math.min(Math.PI/2-.01,goal.phi-dy*.008));}});
function endPtr(e){if(drag&&ptrs.size===1&&Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)<5)pick(e);
  ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;if(!ptrs.size)drag=null;}
canvas.addEventListener('pointerup',endPtr);canvas.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);drag=null;pinch=null});
canvas.addEventListener('wheel',e=>{e.preventDefault();goal.r=Math.max(15,Math.min(400,goal.r*Math.exp(e.deltaY*.001)))},{passive:false});
let assemblyBox=new THREE.Box3();
function setView(v){const c=new THREE.Vector3();
  const box=assemblyBox.clone();if(state.ctx&&ctxGroup.children.length&&v!=='fit'){}
  box.getCenter(c);const size=box.getSize(new THREE.Vector3());const m=Math.max(size.x,size.y,size.z,8);
  goalT.copy(c);goal.r=m*3.2;
  if(v==='front'){goal.theta=0;goal.phi=Math.PI/2-.01}
  else if(v==='side'){goal.theta=Math.PI/2;goal.phi=Math.PI/2-.01}
  else if(v==='top'){goal.phi=.02;goal.theta=0}
  else if(v==='iso'){goal.theta=.75;goal.phi=1.08}
  if(reduce){Object.assign(sph,goal);target.copy(goalT)}}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));

/* ---------- geometry ---------- */
let meshes=[],selected=null,lastBuild=null;
function woodMat(i){const c=new THREE.Color().setHSL(.09,.42,.66+((i*37)%7-3)*.018);return new THREE.MeshStandardMaterial({color:c,roughness:.85,metalness:0})}
function makeGeo(pt){
  if(pt.type==='trap'){const s=new THREE.Shape();s.moveTo(-pt.D/2,0);s.lineTo(pt.D/2,0);s.lineTo(pt.D/2,pt.hf);s.lineTo(-pt.D/2,pt.hb);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:pt.t,bevelEnabled:false});g.rotateY(-Math.PI/2);g.translate(pt.t/2,0,0);return g;}
  if(pt.type==='prof'){const s=new THREE.Shape();pt.pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:pt.w,bevelEnabled:false});g.rotateY(-Math.PI/2);g.translate(pt.w/2,0,0);return g;}
  return new THREE.BoxGeometry(...pt.size);}
function clearGroup(g){while(g.children.length){const c=g.children.pop();c.traverse(o=>{if(o.geometry)o.geometry.dispose()})}}
function buildContext(){
  clearGroup(ctxGroup);const T=TEMPLATES[state.tpl];if(!state.ctx)return;
  const {seat}=fitCalc(),th=state.fit.table;
  const add=(geo,x,y,z)=>{const m=new THREE.Mesh(geo,ctxMat);m.position.set(x,y,z);m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),ctxEdge));ctxGroup.add(m)};
  if(T.context==='none')return;
  if(T.context==='wall'){add(new THREE.BoxGeometry(120,96,.5),0,48,assemblyBox.min.z-.25);return}
  if(T.context==='corner'){const b=assemblyBox,z0=b.min.z,x0=b.min.x;
    add(new THREE.BoxGeometry(b.max.x-x0+30,96,.5),x0+(b.max.x-x0+30)/2,48,z0-.25);add(new THREE.BoxGeometry(.5,96,60),x0-.25,48,z0+30);return}
  add(new THREE.BoxGeometry(48,1.25,24),0,th-.625,-10);
  [[-22,-21],[22,-21],[-22,1],[22,1]].forEach(([x,z])=>add(new THREE.BoxGeometry(1.75,th-1.25,1.75),x,(th-1.25)/2,z));
  if(T.context==='floor'){
    add(new THREE.CylinderGeometry(7,7,1.5,28),0,seat-.75,17);
    [[-5,12],[5,12],[-5,22],[5,22]].forEach(([x,z])=>add(new THREE.CylinderGeometry(.5,.6,seat-1.5,10),x,(seat-1.5)/2,z));
    add(new THREE.TorusGeometry(6.5,.35,8,32).rotateX(Math.PI/2),0,Math.min(14,seat*.4),17);}
}
function build(){
  const T=TEMPLATES[state.tpl],p=state.params[state.tpl];
  clearGroup(asm);meshes=[];const keep=selected&&selected.userData.part.id;selected=null;
  const res=T.build(p);lastBuild=res;
  const inner=new THREE.Group();asm.add(inner);
  res.parts.forEach((pt,i)=>{const g=makeGeo(pt),m=new THREE.Mesh(g,pt.color?new THREE.MeshStandardMaterial({color:pt.color,roughness:.95}):woodMat(i));
    m.position.set(...pt.pos);if(pt.rotX)m.rotation.x=pt.rotX;
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g,15),edgeMat));
    m.userData={part:pt,base:m.position.clone()};inner.add(m);meshes.push(m);});
  inner.rotation.set(res.rot&&res.rot.x||0,0,res.rot&&res.rot.z||0);
  asm.position.set(0,0,T.context==='table'?-14:0);asm.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(inner);
  asm.position.y=(T.context==='table'?state.fit.table:0)-b.min.y;
  if(T.context==='floor')asm.position.z=0;
  asm.updateMatrixWorld(true);assemblyBox.setFromObject(asm);
  // local center for explode
  const lc=new THREE.Box3();meshes.forEach(m=>lc.expandByObject(m));
  inner.updateMatrixWorld(true);
  const center=new THREE.Vector3();new THREE.Box3().setFromObject(inner).getCenter(center);inner.worldToLocal(center);
  meshes.forEach(m=>m.userData.dir=m.userData.base.clone().sub(center));
  applyExplode();
  applyStage();
  if(keep){const m=meshes.find(m=>m.userData.part.id===keep);select(m&&m.visible?m:null)}else select(null);
  buildContext();buildDims();renderPanels();save();
}
function applyExplode(){const k=+document.getElementById('explode').value;
  meshes.forEach(m=>{const d=m.userData.dir;const off=d.clone().multiplyScalar(k*.9);if(d.length()<.01)off.set(0,k*6,0);m.position.copy(m.userData.base).add(off)});}
document.getElementById('explode').oninput=applyExplode;

/* ---------- build stages ---------- */
// stage -1 shows the finished model. Each template's stages[i] is {cut:[ids]} (highlight those parts on a
// faded model), {add:[ids]} (parts join the assembly; later ones stay hidden), or null (finished model).
let stage=-1;
const idIn=(id,list)=>list.some(x=>id===x||id.startsWith(x));
function look(m){const s=m.userData.look||'normal',mat=m.material,ghost=s==='ghost';
  mat.transparent=ghost;mat.opacity=ghost?.14:1;mat.depthWrite=!ghost;m.children[0].visible=!ghost;
  if(!m.userData.wood)m.userData.wood=mat.color.clone();
  mat.color.copy(m.userData.wood);if(s==='new')mat.color.lerp(new THREE.Color(css('--accent')),.55);
  if(m===selected){mat.emissive.set(css('--select'));mat.emissiveIntensity=.35}else mat.emissive.setHex(0);}
function applyStage(){
  const st=stagesOf(),cur=stage>=0?st[stage]:null;
  const added=[];if(cur&&cur.add)for(let i=0;i<=stage;i++)if(st[i]&&st[i].add)added.push(...st[i].add);
  meshes.forEach(m=>{const id=m.userData.part.id;let s='normal';m.visible=true;
    if(cur&&cur.cut)s=idIn(id,cur.cut)?'new':'ghost';
    else if(cur&&cur.add){m.visible=idIn(id,added);if(idIn(id,cur.add))s='new'}
    m.userData.look=s;look(m)});
  if(selected&&!selected.visible)select(null);}
function stagesOf(){const T=TEMPLATES[state.tpl];return (typeof T.stages==='function'?T.stages(state.params[state.tpl]):T.stages)||[]}
function setStage(i){const n=stagesOf().length;stage=i>=n?-1:Math.max(-1,i);applyStage();renderBuild()}

/* ---------- dimensions ---------- */
let dimLabels=[];const labelBox=document.getElementById('labels');
function buildDims(){
  clearGroup(dimGroup);labelBox.innerHTML='';dimLabels=[];if(!state.dims)return;
  const b=assemblyBox,o=3,tk=1;
  const seg=(pts)=>{const g=new THREE.BufferGeometry().setFromPoints(pts.map(a=>new THREE.Vector3(...a)));dimGroup.add(new THREE.LineSegments(g,dimMat))};
  const label=(txt,x,y,z)=>{const d=document.createElement('div');d.className='dimlabel';d.textContent=txt;labelBox.appendChild(d);dimLabels.push({el:d,p:new THREE.Vector3(x,y,z)})};
  const y0=b.min.y,zf=b.max.z+o,xr=b.max.x+o;
  seg([[b.min.x,y0,zf],[b.max.x,y0,zf],[b.min.x,y0,zf-tk],[b.min.x,y0,zf+tk],[b.max.x,y0,zf-tk],[b.max.x,y0,zf+tk],
       [b.min.x,y0,b.max.z],[b.min.x,y0,zf+tk],[b.max.x,y0,b.max.z],[b.max.x,y0,zf+tk]]);
  label(fmt(b.max.x-b.min.x),(b.min.x+b.max.x)/2,y0,zf);
  seg([[xr,y0,b.min.z],[xr,y0,b.max.z],[xr-tk,y0,b.min.z],[xr+tk,y0,b.min.z],[xr-tk,y0,b.max.z],[xr+tk,y0,b.max.z],
       [b.max.x,y0,b.min.z],[xr+tk,y0,b.min.z]]);
  label(fmt(b.max.z-b.min.z),xr,y0,(b.min.z+b.max.z)/2);
  seg([[xr,b.min.y,zf],[xr,b.max.y,zf],[xr-tk,b.max.y,zf],[xr+tk,b.max.y,zf],[b.max.x,b.max.y,b.max.z],[xr,b.max.y,zf]]);
  label(fmt(b.max.y-b.min.y)+(b.min.y>0?' (+'+fmt(b.min.y)+' table)':''),xr,(b.min.y+b.max.y)/2,zf);
}
function placeLabels(){const w=vp.clientWidth,h=vp.clientHeight;
  dimLabels.forEach(l=>{const v=l.p.clone().project(camera);
    if(v.z>1){l.el.style.display='none';return}l.el.style.display='';l.el.style.left=((v.x+1)/2*w)+'px';l.el.style.top=((1-v.y)/2*h)+'px';});}

/* ---------- picking ---------- */
const ray=new THREE.Raycaster();
function pick(e){const r=canvas.getBoundingClientRect();
  ray.setFromCamera({x:(e.clientX-r.left)/r.width*2-1,y:-(e.clientY-r.top)/r.height*2+1},camera);
  const hit=ray.intersectObjects(meshes.filter(m=>m.visible),false)[0];select(hit?hit.object:null);}
function select(m){
  const prev=selected;selected=m;if(prev)look(prev);
  const card=document.getElementById('selcard');
  if(m){look(m);
    const c=m.userData.part.cut,pt=m.userData.part,t=lastBuild.t;
    card.hidden=false;card.innerHTML='<b>'+pt.name+'</b><span class="dims">'+(c.hw?'Hardware':c.stock?fmt(c.L)+' of '+c.stock:fmt(c.L)+' × '+fmt(c.W)+' × '+fmt(t))+'</span>'+(c.note?'<div>'+c.note+'</div>':'');}
  else card.hidden=true;
  document.querySelectorAll('tr[data-part]').forEach(tr=>tr.classList.toggle('sel',!!m&&tr.dataset.part===m.userData.part.name));
}

/* ---------- panels ---------- */
const tplSel=document.getElementById('tpl');
for(const k in TEMPLATES){const o=document.createElement('option');o.value=k;o.textContent=TEMPLATES[k].name;tplSel.appendChild(o)}
tplSel.value=state.tpl;tplSel.onchange=()=>{state.tpl=tplSel.value;stage=-1;build();setView('iso')};
function paramRow(p,val,onset){
  const row=document.createElement('div');row.className='row';
  if(p.type==='select'){row.innerHTML='<label>'+p.label+'</label>';const s=document.createElement('select');
    p.opts.forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;s.appendChild(o)});s.value=val;s.onchange=()=>onset(s.value);row.appendChild(s);return row;}
  const u=p.unit==='deg'?'degrees':(units==='cm'?'cm':'in');
  row.innerHTML='<label><span>'+p.label+'</span><span class="unit">'+u+'</span></label>';
  const ctrl=document.createElement('div');ctrl.className='ctrl';
  const r=document.createElement('input');r.type='range';const n=document.createElement('input');n.type='number';
  const st=p.unit==='deg'?p.step:(units==='cm'?.1:p.step);
  [r,n].forEach(i=>{i.min=toDisp(p.min,p);i.max=toDisp(p.max,p);i.step=st;i.value=toDisp(val,p)});
  r.setAttribute('aria-label',p.label);n.setAttribute('aria-label',p.label+' value');
  r.oninput=()=>{n.value=r.value;onset(fromDisp(+r.value,p))};
  n.onchange=()=>{let v=+n.value;if(isNaN(v))v=toDisp(val,p);v=Math.max(+n.min,Math.min(+n.max,v));n.value=v;r.value=v;onset(fromDisp(v,p))};
  ctrl.append(r,n);row.appendChild(ctrl);return row;}
function renderDesign(){
  const T=TEMPLATES[state.tpl],P=state.params[state.tpl],pane=document.getElementById('pane-design');pane.innerHTML='';
  const h=document.createElement('h2');h.textContent=T.name;pane.appendChild(h);
  const hint=document.createElement('p');hint.className='hint';hint.textContent=lastBuild.summary;pane.appendChild(hint);
  T.params.forEach(p=>pane.appendChild(paramRow(p,P[p.k],v=>{P[p.k]=v;build()})));
  lastBuild.warns.forEach(w=>{const d=document.createElement('p');d.className='note';d.textContent=w;pane.appendChild(d)});
  const rb=document.createElement('button');rb.className='btn ghost';rb.textContent='Reset this project';rb.style.marginTop='12px';
  rb.onclick=()=>{T.params.forEach(p=>P[p.k]=p.v);build()};pane.appendChild(rb);
  renderSaves(pane,T,P);
}
function renderSaves(pane,T,P){
  const sec=document.createElement('div');sec.className='saves';
  const mine=state.saves.filter(v=>v.tpl===state.tpl),same=v=>T.params.every(p=>v.params[p.k]===P[p.k]);
  sec.innerHTML='<h3>Saved designs</h3><p class="hint">Save these settings under a name. Reset only changes the sliders, so your saved designs stay safe.</p>'+
    '<form class="saverow"><input id="save-name" maxlength="60" placeholder="Name, e.g. Garage corner" aria-label="Design name"><button class="btn">Save</button></form>'+
    (mine.length?'<ul>'+mine.map(v=>'<li'+(same(v)?' class="on"':'')+'><span><b>'+v.name.replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';')+'</b><small>'+new Date(v.at).toLocaleDateString()+(same(v)?' · showing now':'')+'</small></span>'+
      '<button class="btn ghost" data-load="'+v.id+'">Load</button><button class="btn ghost" data-save="'+v.id+'" title="Replace with the current settings">Update</button><button class="btn ghost" data-del="'+v.id+'" aria-label="Delete '+v.name.replace(/"/g,'')+'">✕</button></li>').join('')+'</ul>':'<p class="hint">No saved designs for this project yet.</p>')+
    '<div class="saveio"><button class="btn ghost" id="save-export"'+(state.saves.length?'':' disabled')+'>Export all ('+state.saves.length+')</button><label class="btn ghost">Import<input type="file" id="save-import" accept=".json,application/json" hidden></label></div>';
  pane.appendChild(sec);
  const find=id=>state.saves.find(v=>v.id===id);
  sec.querySelector('form').onsubmit=e=>{e.preventDefault();const inp=sec.querySelector('#save-name'),name=inp.value.trim()||T.name+' '+(mine.length+1);
    const old=mine.find(v=>v.name.toLowerCase()===name.toLowerCase());
    if(old){if(!confirm('Replace the saved design "'+old.name+'"?'))return;old.params={...P};old.at=Date.now();}
    else state.saves.push({id:String(Date.now()),name,tpl:state.tpl,params:{...P},at:Date.now()});
    save();renderDesign();};
  sec.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{const v=find(b.dataset.load);Object.assign(P,v.params);build();});
  sec.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{const v=find(b.dataset.save);v.params={...P};v.at=Date.now();save();renderDesign();});
  sec.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const v=find(b.dataset.del);if(!confirm('Delete the saved design "'+v.name+'"?'))return;
    state.saves=state.saves.filter(x=>x!==v);save();renderDesign();});
  sec.querySelector('#save-export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({app:'benchwork',saves:state.saves},null,1)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='benchwork-designs.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  sec.querySelector('#save-import').onchange=async e=>{const f=e.target.files[0];if(!f)return;
    try{const got=cleanSaves(JSON.parse(await f.text()).saves),ids=new Set(state.saves.map(v=>v.id)),add=got.filter(v=>!ids.has(v.id));
      state.saves.push(...add);save();renderDesign();alert('Imported '+add.length+' design'+(add.length===1?'':'s')+(got.length>add.length?' ('+(got.length-add.length)+' already here)':'')+'.');}
    catch(err){alert('That file is not a Benchwork designs export.')}};
}
function renderFit(){
  const pane=document.getElementById('pane-fit'),T=TEMPLATES[state.tpl];pane.innerHTML='';
  pane.insertAdjacentHTML('beforeend','<h2>Fit to your body</h2><p class="hint">Measure while seated, wearing the shoes you work in. These numbers size the stool and the footrest.</p>');
  const defs=[{k:'table',label:'Table height',min:24,max:50,step:.25},{k:'elbow',label:'Elbow height above seat',min:5,max:14,step:.25},
    {k:'knee',label:'Floor to back of knee',min:12,max:24,step:.25},{k:'thigh',label:'Thigh thickness',min:3,max:10,step:.25}];
  defs.forEach(d=>pane.appendChild(paramRow(d,state.fit[d.k],v=>{state.fit[d.k]=v;updateFit();buildContext();if(T.context==='table')build();save()})));
  const out=document.createElement('div');out.className='readout';out.id='fitout';pane.appendChild(out);updateFit();}
function updateFit(){
  const out=document.getElementById('fitout');if(!out)return;const f=fitCalc(),T=TEMPLATES[state.tpl];
  let html='<div class="kv"><span>Stool seat height</span><b>'+fmt(f.seat)+'</b></div><div class="kv"><span>Footrest height</span><b>'+fmt(f.foot)+'</b></div><div class="kv"><span>Thigh clearance under table</span><b>'+fmt(f.clear)+'</b></div>';
  html+=f.clear<2?'<p class="note">Less than 2" of thigh clearance. Your legs may hit the table; consider a slightly lower stool.</p>':'<p class="note ok">Enough room for your thighs under the tabletop.</p>';
  out.innerHTML=html;
  if(T.fitKind){const b=document.createElement('button');b.className='btn';b.style.marginTop='14px';
    if(T.fitKind==='height'){b.textContent='Set footrest to '+fmt(f.foot);b.onclick=()=>{state.params[state.tpl].height=Math.max(6,Math.min(22,f.foot));build()};}
    else{const P=state.params.flipbox,opts=[['flat',P.height],['edge',P.width],['end',P.length]];
      const best=opts.reduce((a,c)=>Math.abs(c[1]-f.foot)<Math.abs(a[1]-f.foot)?c:a);
      b.textContent='Turn box to the closest height ('+fmt(best[1])+')';b.onclick=()=>{P.rest=best[0];build()};}
    out.appendChild(b);}
}
// First-fit decreasing: how many 96" sticks the pieces actually need, allowing 1/8" per saw cut.
// Pieces longer than a stick are butt-joined: whole sticks plus the leftover length.
function sticks(list){const free=[];let whole=0;list=list.flatMap(L=>{while(L>96){whole++;L-=96}return L>0?[L]:[]});
  list.sort((x,y)=>y-x).forEach(L=>{const i=free.findIndex(f=>f>=L);if(i<0)free.push(96-L-.125);else free[i]-=L+.125});return free.length+whole}
// Plywood the way a store rips it: each part takes a strip of its short side across the 48" width, laid along the 96" length.
function packSheets(list){const sheets=[];let over=0;
  list.map(([x,y])=>[Math.min(x,y),Math.max(x,y)]).sort((p,q)=>q[0]-p[0]||q[1]-p[1]).forEach(([w,l])=>{
    if(w>48||l>96){over++;return}
    for(const sh of sheets)for(const st of sh.strips)if(st.w>=w&&st.len>=l){st.len-=l+.125;return}
    let sh=sheets.find(sh=>sh.w>=w-.25);// the last strip may come out a saw kerf narrow
    if(!sh){sh={w:48,strips:[]};sheets.push(sh)}
    sh.w-=w+.125;sh.strips.push({w,len:96-l-.125});});
  return {n:sheets.length,over};}
function renderCut(){
  const pane=document.getElementById('pane-cut'),t=lastBuild.t,stocks=[...new Set(lastBuild.parts.filter(pt=>pt.cut.stock).map(pt=>pt.cut.stock))];
  pane.innerHTML='<h2>Cut list</h2><p class="hint">'+(stocks.length?'Boards from '+fmt(t)+' sheet stock, frame from '+stocks.map(k=>k+' ('+LUMBER[k]+' actual)').join(' and ')+' lumber.':'All parts from '+fmt(t)+' sheet stock.')+' Tap a row to find it in the model.</p>';
  const groups=[];lastBuild.parts.forEach(pt=>{const key=pt.name+'|'+pt.cut.L.toFixed(3)+'|'+pt.cut.W.toFixed(3);
    const g=groups.find(g=>g.key===key);if(g)g.qty++;else groups.push({key,qty:1,pt})});
  const size=c=>c.hw?'hardware':c.stock?fmt(c.L)+' '+c.stock:fmt(c.L)+' × '+fmt(c.W);
  let area=0,run={},pieces={};let rows='';groups.forEach(g=>{const c=g.pt.cut;if(c.stock){run[c.stock]=(run[c.stock]||0)+g.qty*c.L;for(let i=0;i<g.qty;i++)(pieces[c.stock]=pieces[c.stock]||[]).push(c.L)}else if(!c.hw)area+=g.qty*c.L*c.W;
    rows+='<tr data-part="'+g.pt.name+'"><td>'+g.pt.name+(c.note?'<small>'+c.note+'</small>':'')+'</td><td class="num">'+g.qty+'</td><td class="num">'+size(c)+'</td></tr>'});
  pane.insertAdjacentHTML('beforeend','<table><thead><tr><th>Part</th><th>Qty</th><th>Size</th></tr></thead><tbody>'+rows+'</tbody></table>');
  const sq=area/144*1.15,pk=packSheets(lastBuild.parts.filter(pt=>!pt.cut.stock&&!pt.cut.hw).map(pt=>[pt.cut.L,pt.cut.W]));
  let kv=!area?'':'<div class="kv"><span>Sheet material with 15% waste</span><b>'+(units==='cm'?(sq*0.0929).toFixed(2)+' m²':sq.toFixed(1)+' sq ft')+'</b></div>'+
    (pk.n>1?'<div class="kv"><span>4×8 sheets to buy</span><b>'+pk.n+'</b></div>':'<div class="kv"><span>Share of a 4×8 sheet</span><b>'+Math.round(sq/32*100)+'%</b></div>');
  for(const k in run){const lf=run[k]*1.1/12;kv+='<div class="kv"><span>'+k+' with 10% waste</span><b>'+(units==='cm'?(lf*0.3048).toFixed(2)+' m':lf.toFixed(1)+' ft')+'</b></div><div class="kv"><span>8 ft '+k+'s to buy</span><b>'+sticks(pieces[k])+'</b></div>';}
  pane.insertAdjacentHTML('beforeend','<div class="readout">'+kv+'</div>');
  const cb=document.createElement('button');cb.className='btn ghost';cb.style.marginTop='14px';cb.textContent='Copy cut list';
  cb.onclick=async()=>{const txt=TEMPLATES[state.tpl].name+' cut list ('+fmt(t)+' stock)\n'+groups.map(g=>g.qty+' × '+g.pt.name+': '+size(g.pt.cut)+(g.pt.cut.note?' ('+g.pt.cut.note+')':'')).join('\n');
    try{await navigator.clipboard.writeText(txt);cb.textContent='Copied'}catch(e){cb.textContent='Copy blocked by browser'}setTimeout(()=>cb.textContent='Copy cut list',1800)};
  pane.appendChild(cb);
  pane.querySelectorAll('tr[data-part]').forEach(tr=>tr.onclick=()=>{const m=meshes.find(m=>m.visible&&m.userData.part.name===tr.dataset.part);if(m)select(m)});
  if(selected)select(selected);
}
function renderBuild(){const pane=document.getElementById('pane-build'),T=TEMPLATES[state.tpl],steps=T.steps(state.params[state.tpl]);
  pane.innerHTML='<h2>Build steps</h2><p class="hint">Tap a step to see it in the model: parts for that step are highlighted. Measure and dry-fit before you glue.</p>'+
    '<div class="stepnav"><button class="btn ghost" id="st-prev"'+(stage<0?' disabled':'')+'>Back</button><span>'+(stage<0?'Finished model':'Step '+(stage+1)+' of '+steps.length)+'</span>'+
    '<button class="btn" id="st-next">'+(stage<0?'Start':stage===steps.length-1?'Finish':'Next')+'</button></div>'+
    '<ol class="steps">'+steps.map((s,i)=>'<li'+(i===stage?' class="on" aria-current="step"':'')+'><button data-step="'+i+'">'+s+'</button></li>').join('')+'</ol>';
  pane.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>setStage(+b.dataset.step===stage?-1:+b.dataset.step));
  pane.querySelector('#st-prev').onclick=()=>setStage(stage-1);
  pane.querySelector('#st-next').onclick=()=>setStage(stage+1);}
/* ---------- materials ---------- */
// Shopping list from the current build. Screw counts are rules of thumb: 4 per lumber piece, one every 8" of edge on sheet parts.
const HW_PRICE={'Coat hook':4,'Shelf bracket':6,'Foam field tile':10};
function materials(){
  const parts=lastBuild.parts,t=lastBuild.t,items=[],add=(key,name,qty,price,note)=>qty&&items.push({key,name,qty,price:key in state.prices?state.prices[key]:price,note});
  const sheet=parts.filter(pt=>!pt.cut.stock&&!pt.cut.hw);
  if(sheet.length){const pk=packSheets(sheet.map(pt=>[pt.cut.L,pt.cut.W]));
    add('ply:'+t,'4×8 sheet of '+fmt(t)+' plywood',pk.n,Math.round(60*t/.75),pk.over?pk.over+' part(s) are bigger than a sheet: buy extra and join them':'Counted by fitting the parts into ripped strips');}
  const byStock={};parts.filter(pt=>pt.cut.stock).forEach(pt=>(byStock[pt.cut.stock]=byStock[pt.cut.stock]||[]).push(pt.cut.L));
  for(const k in byStock)add('lum:'+k,'8 ft '+k,sticks(byStock[k]),STOCK[k].price,byStock[k].length+' pieces');
  const scr={};for(const k in byStock)scr[STOCK[k].screw]=(scr[STOCK[k].screw]||0)+byStock[k].length*4;
  for(const len in scr)add('scr:'+len,len+' wood screws',scr[len],SCREW_PRICE[len],'Frame joints and wall fixings. Buy a box of 100');
  if(sheet.length){const len=t>.75?'1 5/8"':'1 1/4"';add('scr:'+len,len+' wood screws',Math.ceil(sheet.reduce((n,pt)=>n+Math.max(4,Math.round(2*(pt.cut.L+pt.cut.W)/8)),0)/25)*25,.04,'Fastening the boards');}
  const hw={};parts.filter(pt=>pt.cut.hw&&!pt.cut.owned).forEach(pt=>hw[pt.name]=(hw[pt.name]||0)+1);
  for(const k in hw)add('hw:'+k,k,hw[k],HW_PRICE[k]||5,'Hardware');
  add('glue','Wood glue (8 oz)',1,6,'');
  add('sand','Sandpaper pack (120 and 220 grit)',1,8,'');
  const sq=sheet.reduce((n,pt)=>n+pt.cut.L*pt.cut.W,0)/144;
  add('finish','Finish, quart (paint or polyurethane)',sq>60?2:1,20,'Two coats on the visible faces');
  return items;}
const money=v=>'$'+v.toFixed(2);
function renderMaterials(){
  const pane=document.getElementById('pane-mat'),items=materials();
  pane.innerHTML='<h2>Materials</h2><p class="hint">Shopping list for this design. Prices are rough home-center prices; change any of them to match your store and they are remembered.</p>';
  const rows=items.map((it,i)=>'<tr><td>'+it.name+(it.note?'<small>'+it.note+'</small>':'')+'</td><td class="num">'+it.qty+'</td><td><input class="price" type="number" min="0" step="0.01" data-i="'+i+'" aria-label="Price each for '+it.name+'" value="'+it.price+'"></td><td class="num" data-cost="'+i+'">'+money(it.qty*it.price)+'</td></tr>').join('');
  pane.insertAdjacentHTML('beforeend','<table class="mat"><thead><tr><th>Item</th><th>Qty</th><th>Each</th><th>Cost</th></tr></thead><tbody>'+rows+'</tbody></table><div class="readout"><div class="kv"><span>Estimated total</span><b id="mat-total"></b></div></div>');
  const total=()=>{pane.querySelector('#mat-total').textContent=money(items.reduce((n,it)=>n+it.qty*it.price,0))};total();
  pane.querySelectorAll('input.price').forEach(inp=>inp.oninput=()=>{const it=items[+inp.dataset.i],v=Math.max(0,+inp.value||0);it.price=v;state.prices[it.key]=v;save();
    pane.querySelector('[data-cost="'+inp.dataset.i+'"]').textContent=money(it.qty*v);total();});
  const cb=document.createElement('button');cb.className='btn ghost';cb.style.marginTop='14px';cb.textContent='Copy shopping list';
  cb.onclick=async()=>{const txt=TEMPLATES[state.tpl].name+' shopping list\n'+items.map(it=>it.qty+' × '+it.name+' @ '+money(it.price)+' = '+money(it.qty*it.price)).join('\n')+'\nTotal: '+money(items.reduce((n,it)=>n+it.qty*it.price,0));
    try{await navigator.clipboard.writeText(txt);cb.textContent='Copied'}catch(e){cb.textContent='Copy blocked by browser'}setTimeout(()=>cb.textContent='Copy shopping list',1800)};
  pane.appendChild(cb);}
function renderPanels(){renderDesign();renderFit();renderCut();renderBuild();renderMaterials()}
document.querySelectorAll('[role=tab]').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('[role=tab]').forEach(x=>x.setAttribute('aria-selected',x===b));
  document.querySelectorAll('.pane').forEach(p=>p.hidden=p.id!=='pane-'+b.dataset.tab);
  if(b.dataset.tab!=='build'&&stage>=0)setStage(-1);});
function setUnits(u){units=state.units=u;document.getElementById('u-in').setAttribute('aria-pressed',u==='in');document.getElementById('u-cm').setAttribute('aria-pressed',u==='cm');build()}
document.getElementById('u-in').onclick=()=>setUnits('in');document.getElementById('u-cm').onclick=()=>setUnits('cm');
const tCtx=document.getElementById('t-ctx'),tDim=document.getElementById('t-dim');
function syncToggles(){tCtx.setAttribute('aria-pressed',state.ctx);tDim.setAttribute('aria-pressed',state.dims)}
tCtx.onclick=()=>{state.ctx=!state.ctx;syncToggles();buildContext();save()};
tDim.onclick=()=>{state.dims=!state.dims;syncToggles();buildDims();save()};

/* ---------- loop ---------- */
function resize(){const w=vp.clientWidth,h=vp.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix()}
new ResizeObserver(resize).observe(vp);
function loop(){const k=.18;sph.theta+=(goal.theta-sph.theta)*k;sph.phi+=(goal.phi-sph.phi)*k;sph.r+=(goal.r-sph.r)*k;target.lerp(goalT,k);
  placeCam();renderer.render(scene,camera);placeLabels();requestAnimationFrame(loop)}
applyTheme();syncToggles();
document.getElementById('u-in').setAttribute('aria-pressed',units==='in');document.getElementById('u-cm').setAttribute('aria-pressed',units==='cm');
build();resize();setView('iso');Object.assign(sph,goal);target.copy(goalT);loop();
})();
