(function (widget,cId,vids){
  var _ONND_URL_EMBED = "https://video.onnetwork.tv" ;
  var _ONND_URL_CDN_EMBED = "https://cdn.onnetwork.tv" ;
  var overwrites = ""
  var iid=Date.now() * Math.floor( 1 + Math.random() * 100 ) + "2114" ;
  var uid="id"+Date.now() * Math.floor( 1 + Math.random() * 100 ) + "2114" ;
  var playerInserted = false ;
  var nstylet = '  div.totalcontainerexs.widgettype4{ display:block;width:100%;margin:0px;height:auto;box-sizing:border-box;align-items:stretch; background-color:transparent ;}' +
                '  div.playercontainerexs.widgettype4{ width:100%;height:auto;display:block; }' +
                '  div.widgetcontainerexs.widgettype4{ width:100%;height:auto;display:block; }' +
                '  div.widgetcontainerexs.widgettype4>div{ position:relative;display:block;width:100%;height:200px;left:0px;top:0px;border:none;margin:0px;padding:0px;overflow:hidden;padding-bottom:0%; }' +
//                '  div.widgetcontainerexs.wid2114>div{ padding-bottom:0%; height:200px; }' +
                '  div.widgetcontainerexs.widgettype4>div>iframe{ position:absolute;display:block;width:100%;height:100%;left:0px;top:0px;border:none;margin:0px;padding:0px;overflow:hidden; }' ;

  var nefrag = '<div class="playercontainerexs widgettype4 " id="p'+uid+'" data-cfasync="false"></div>' +
               '<div class="widgetcontainerexs widgettype4 wid'+widget+'" data-cfasync="false" >' +
               '<div id="ld'+uid+'" data-cfasync="false" >' +
               '</div></div>' ;

  var widgetPlayer = null;
  function insertWidget( container , ib ){
    var nstyle = document.createElement( "style" );
    nstyle.innerHTML = nstylet ;
    nstyle.dataset['cfasync']="false";
    var tcontainer = document.createElement( "div" );
    tcontainer.innerHTML = nefrag ;
    tcontainer.className = "totalcontainerexs widgettype4" ;
    tcontainer.dataset['cfasync']="false";
    document.body.appendChild( nstyle );
    if (ib){ container.parentElement.insertBefore( tcontainer , document.currentScript ); }
    else{ container.appendChild( tcontainer ); }
    var wmc=document.getElementById('ld'+uid);
    if(wmc){
      import( _ONND_URL_CDN_EMBED + '/js/widgets/widgetScrollist.js?s=202209160956' ).then(({WidgetPlayer})=>{
         var wConfig = {"widgetId":2114,"devicetype":"desktop","playlistitems":[{"mid":"1911879","poster_url":"https://cdnt.onnetwork.tv/poster/1/9/1911879_6m.jpg","id":"1911879","length":"241","title":"CPU vs GPU _ Simply Explained"},{"mid":"1911878","poster_url":"https://cdnt.onnetwork.tv/poster/1/9/1911878_5m.jpg","id":"1911878","length":"521","title":"LV MSI Trident 3 9th Gen Teardown + GPU Swap + Storage"},{"mid":"1911882","poster_url":"https://cdnt.onnetwork.tv/poster/1/9/1911882_5m.jpg","id":"1911882","length":"529","title":"_2025_ BEST NVIDIA Control Panel Settings For GAMING & Performance!"},{"mid":"1911874","poster_url":"https://cdnt.onnetwork.tv/poster/1/9/1911874_6m.jpg","id":"1911874","length":"12","title":"This GPU is the fastest low profile GPU!"},{"mid":"1911881","poster_url":"https://cdnt.onnetwork.tv/poster/1/9/1911881_4m.jpg","id":"1911881","length":"699","title":"NVIDIA just announced the ULTIMATE desktop AI PC"}],"frid":1911879,"tpb":56.25,"addcss":"","firstmidvideo":"MTkxMTg3OSwxNng5LDQsMyw1MTcwLDE4MDIyLDEsMCwzLDMsMCwwLDcsMCw0LDIsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLC0xOzYwOzA7LTE7VFI7MDs2MDswOzU2LDAsMCwwLDAsMCwwOzA7MDswOzA7MDswLDA=","defsd":{"ttextlines":"3","pso":"1","plheight":"200","plback":"#ffffff","nso":"1","navwidth":"30","navheight":"20","navimleft":"1","navimright":"17","navimtop":"0","navimbottom":"0","navback":"rgb(255, 255, 255)","navcolor":"rgb(0, 0, 0)","navbackhv":"rgb(255, 255, 255)","navcolorhv":"rgb(0, 0, 0)","iso":"1","iwidth":"160","iback":"rgb(255, 255, 255)","ibackhv":"rgb(255, 255, 255)","ibackpl":"rgb(255, 255, 255)","pmleft":"0","pmright":"20","pmtop":"20","pmbottom":"10","tmleft":"0","tmright":"20","tmtop":"3","tmbottom":"11","tfontsize":"16","tcolor":"rgb(153, 153, 153)","tcolorhv":"rgb(0, 0, 0)","tcolorpl":"rgb(0, 0, 0)","dfontsize":"12","dcolor":"rgb(255, 255, 255)","dcolorhv":"rgb(255, 255, 255)","dcolorpl":"rgb(255, 255, 255)","dback":"rgba(0, 0, 0, 0.5)","dbackhv":"rgba(0, 0, 0, 0.5)","dbackpl":"rgba(0, 0, 0, 0.5)","spsize":"21","spcolor":"rgb(0, 0, 0)","spcolorhv":"rgb(255, 255, 255)","spcolorpl":"rgb(255, 255, 255)","stcolor":"#ffffff","stcolorhv":"rgba(13, 4, 0, 0.5)","stcolorpl":"rgba(13, 4, 0, 0.5)","playlist":5170}} ;
         wConfig['uid'] = uid;
         wConfig['iid'] = iid ;
         wConfig['cId'] = 'ld'+uid ;
         wmc=document.getElementById('ld'+uid);
         widgetPlayer = new WidgetPlayer(wConfig, wmc);
      });
    }
  }
  window.addEventListener("message",(e)=>{
    try{
      if (!e.data.indexOf || (e.data.indexOf("onntv://")!=0)){ return ; }
      var com = {} ;
      try{
        com = JSON.parse( e.data.substr( 8 ) );         
      }catch(e){ com = {} ; }
      switch (com.comm){
        case "widgetloaded": 
          if(parseInt(com.iid)==iid && !playerInserted){ 
            console.log( "insertujemy" );
            console.log( com );
            playerInserted = true ;
            var pscript = document.createElement( "script" );
            pscript.src = _ONND_URL_EMBED + '/embed.php?mid='+com.subject+'&iid='+iid+'&cId=p'+uid+'&widget='+widget+vids+overwrites ;
            pscript.async = true ;
            document.body.appendChild( pscript );
          } 
          break ;
      }
    }catch(e){}
  },false);
  if ((cId!="") && document.getElementById( cId )){
    insertWidget( document.getElementById( cId ) , false );
  }else 
  if (document.currentScript && document.currentScript.parentElement){
    insertWidget( document.currentScript , true );
  }
})(2114,"","");