/* JS port of Flash skin viewer */

var numSkins = 0;
var frames = [
    {name:"Idle",  time:0, frames:[0] },
    {name:"Move",  time:3, frames:[1, 2, 3, 4, 5] },
    {name:"Sneak", time:8, frames:[6, 7] },
    {name:"Jump",  time:0, frames:[8] },
    {name:"Mine",  time:3, frames:[9, 10, 11, 12, 13] },
    {name:"Hurt",  time:0, frames:[14] },
    {name:"Sit",   time:0, frames:[15] },
    {name:"Cart",  time:0, frames:[16] }
];
var animations = {};
function nextAnimation(id) {
    if(animations[id] == undefined) animations[id] = {animation:1, frame:0, timer:0};
    else animations[id] = {animation:(animations[id].animation+1)%frames.length, frame:0, timer:0};
    $('#skin'+id+'-animation-name').text(frames[animations[id].animation].name);
}
function animateSkins() {
    for(var id in animations) {
        if(animations[id].timer <= 0) {
            animations[id].frame = (animations[id].frame+1)%frames[animations[id].animation].frames.length;
            $('#image'+id).css("background-position", (frames[animations[id].animation].frames[animations[id].frame] * -parseInt($('#image'+id).css("background-size"))/17) + "px 0px");
            animations[id].timer = frames[animations[id].animation].time;
            if(animations[id].animation == 0) delete animations[id];
        } else animations[id].timer--;
    }
}
setInterval(animateSkins, 30);
function appendSkin(to, id, name, author, inlineWidth) {
    var html;
    var uniqId = id+"-"+(++numSkins);
    
    name    = String(name  ).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    author  = String(author).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    
    if(inlineWidth !== undefined) {
        html = $(
             "<div class='skin-wrapper borderless skin"+id+"' id='skin"+uniqId+"'>"
            +"    <div class='skin-transparency' style='width:"+inlineWidth+"px;height:"+(inlineWidth/160*220)+"px'>"
            +"        <div class='skin-preview image"+id+"' style='background-size:"+(inlineWidth*17)+"px auto' id='image"+uniqId+"'></div>"
            +"    </div>"
            +"    <div class='skin-button' style='width:"+(inlineWidth-8)+"px' onclick='JavaScript:nextAnimation(\""+uniqId+"\");'>"
            +"        <span style='color:#888888;'>"+(inlineWidth>150?"Animation: ":"Anim: ")+"</span><span id='skin"+uniqId+"-animation-name'>Idle</span>"
            +"    </div>"
            +"</div>"
        ).appendTo($(to));
    } else {
        html = $(
             "<div class='skin-wrapper skin"+id+"' id='skin"+uniqId+"'>"
            +"    <a href='https://mineblocks.com/1/skin/"+id+"' class='skin-name' title='"+name+"'>"+name+"</a>"
            +"    <div class='skin-author' title='"+author+"'>"+author+"</div>"
            +"    <div class='skin-transparency'>"
            +"        <div class='skin-preview image"+id+"' id='image"+uniqId+"'></div>"
            +"    </div>"
            +"    <div class='skin-button' onclick='JavaScript:nextAnimation(\""+uniqId+"\");'>"
            +"        <span style='color:#888888;'>Animation: </span><span id='skin"+uniqId+"-animation-name'>Idle</span>"
            +"    </div>"
            +"</div>"
        ).appendTo($(to));
    }
    
    var canvas = document.createElement('canvas');
    canvas.width = 272;
    canvas.height = 22;
    var context = canvas.getContext('2d');
    
    var skinImage = new Image();
    skinImage.onload = function() {
        context.drawImage(skinImage, 0, 0);
        
        var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
        var px = imgData.data;
        
        var hasTransparency = false;
        for(var i=0, n=px.length; i<n; i+=4) {
            if(px[i+3] != 255) {
                hasTransparency = true;
                break;
            }
        }
        if(!hasTransparency) {
		    var transparentColor, transparentColor2;
		    transparentColor = transparentColor2 = [px[canvas.width*4+4+0], px[canvas.width*4+4+1], px[canvas.width*4+4+2]];
		    if(transparentColor[0] == 255 && transparentColor[1] == 0 && transparentColor[2] == 255) transparentColor2 = [255, 1, 255];
		    else if(transparentColor[0] == 255 && transparentColor[1] == 1 && transparentColor[2] == 255) transparentColor2 = [255, 0, 255];
		    
            for(var i=0, n=px.length; i<n; i+=4) {
                if(px[i+0] == transparentColor[0] && px[i+1] == transparentColor[1] && px[i+2] == transparentColor[2]) {
                    px[i+3] = 0;
                } else if(px[i+0] == transparentColor2[0] && px[i+1] == transparentColor2[1] && px[i+2] == transparentColor2[2]) {
                    px[i+3] = 0;
                }
            }
        }
        
        context.putImageData(imgData, 0, 0);
        
        html.find('.skin-preview').css('background-image', 'url(' + canvas.toDataURL() + ')');
    };
    skinImage.src = "https://mineblocks.com/1/skins/images/"+id+".png";
}
function deleteSkin(id) {
    $('#skin'+id).remove();
    delete animations[id];
}