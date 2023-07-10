const can = document.getElementById("C")
can.style.zIndex = -1
can.style.position = 'absolute'
const c = can.getContext("2d")
const rect = can.getBoundingClientRect()
var cW = 1
var cH = 1
var cX = window.innerWidth
var cY = window.innerHeight
var xlim = [-20,20]
var ylim = [-20,20]
var lw = 0.1
c.LineWidth = lw
var Color = "black"
var Font = "20px serif"
var X0=0,Y0=0,X,Y
var fX = cX/2 + 30 
var fY = cY - 50
var fW = cX/2  - 100
var fH = cY - 100
var scale = 1 //zoom
var tempD = {}
var tempD2 = {}
var selH = 0
var selW = 0
var z_eye = -12
var z_screen = 0
var x_eye = -10
var y_eye = 0
var begining = true
/**Similar to c.moveTo but uses position as seen in frame*/
function GoTo(x,y){
    X = fX + (fW*(x-xlim[0])/(xlim[1]-xlim[0]))
    Y = fY - (fH*(y-ylim[0])/(ylim[1]-ylim[0]))
    c.moveTo(X,Y)
}
/**Similar to c.lineTo but uses position as seen in frame */
function LineTo(x,y){
    X = fX + (fW*(x-xlim[0])/(xlim[1]-xlim[0]))
    Y = fY - (fH*(y-ylim[0])/(ylim[1]-ylim[0]))
    c.lineTo(X,Y)
}
/**Similar to c.strokeRect but uses position as seen in frame */
function Rect(x,y,w,h){
    X = fX + fW*(x-xlim[0])/(xlim[1]-xlim[0])
    Y = fY - fH*(y-ylim[0])/(ylim[1]-ylim[0])
    var W = fW*(w)/(xlim[1]-xlim[0])
    var H = - fH*(h)/(ylim[1]-ylim[0])
    c.strokeRect(X,Y,W,H)
}
function point(x,y){
    GoTo(x,y)
    Dot()
}
/**
 * 2D plots
 * @param {*} data object with x,y properties being arrays of coordinates of points
 * @param {*} x_range [x_low,x_high] The x values shown at edges of frame
 * @param {*} y_range [y_low,y_high] The y values shown at edges of frame
 * @param {*} frame If true, draws the frame
 */
function plot(data,x_range=xlim,y_range=ylim,frame=false){
    xlim = x_range
    ylim = y_range
    var n = data.x.length
    if(n !== data.y.length){
        print("incompatible arrays")
        return;
    }

    switch (data.type) {

        case "scatter": 
            for(var i=0;i<n;i++){
                GoTo(data.x[i],data.y[i])
                if(data.color){c.fillStyle=data.color[i]}
                if(data.r){Dot(c,X,Y,data.r[i])}
                else{Dot()}
            }
            break;

        case "bar":
            for(var i=0;i<n;i++){
                Rect(data.x[i],0,data.width,data.y[i])
                if(data.color){c.fillStyle=data.color[i];c.fill()}
            }
            break;

        case "line":
        case undefined:
            c.beginPath()
            GoTo(data.x[0],data.y[0])
            for(var i=1;i<data.x.length;i++){
                LineTo(data.x[i],data.y[i])
            }
            c.stroke()
            break;

        default:
            print("Unrecognised type for plot")
    }
    Remember()
    if(frame){Frame()}
}
/**
 * Draws the frame
 * @param {*} Frame_Left fraction of cX
 * @param {*} Frame_Bottom fraction of cY
 * @param {*} Frame_Width fraction of cX
 * @param {*} Frame_Height fraction of cY
 */
function Frame(Frame_Left=fX/cX,Frame_Bottom= 1 - fY/cY,Frame_Width = fW/cX,Frame_Height=fH/cY){
    fW = Frame_Width * cX
    fH = Frame_Height * cY
    fX = Frame_Left * cX
    fY = (1 - Frame_Bottom) * cY
    c.strokeRect(fX,fY-fH,fW,fH)
    var txt = `(${xlim[0]},${ylim[0]})`
    GoTo(xlim[0],ylim[0])
    c.fillText(txt,X-5*(txt.length),Y+20)
    txt = `(${xlim[1]},${ylim[1]})`
    GoTo(xlim[1],ylim[1])
    c.fillText(txt,X,Y)
}
/**
 * Plots a single variable, single valued function
 * @param {*} x_range [x_low,x_high] The x values shown at edges of frame
 * @param {*} y_range [y_low,y_high] The y values shown at edges of frame
 * @param {*} frame If true, draws the frame
 * @param {*} n number of samples to take 
 * @param {*} f function to plot
 */
function fplot(x_range,y_range,n,f,frame=false){
    print("fplot running")
    if(!y_range){
    var ymin = f(x_range[0])
    var ymax = f(x_range[1])
    }
    var dx = (x_range[1] - x_range[0])/n
    var x = []
    var y = []
    for(var i=0;i<=n;i++){
        y.push(f(x_range[0] + dx*i))
        x.push(x_range[0] + dx*i)
        if(!y_range){
        if(y[i]>ymax){ymax = y[i]}
        if(y[i]<ymin){ymin = y[i]}
        }
    }
    if(!y_range){y_range=[ymin,ymax]}
    data = {
        "x":x,
        "y":y,
        "type":"line",
    }
    plot(data,x_range,y_range,frame)
}
/**
 * Plots a 3D mesh
 * @param {*} data object with x,y properties being nested arrays of coordinates of points
 * @param {*} contour if true, draws the rows only, otherwise draws the columns too.
 * @param {*} x_range [x_low,x_high] : range of x values of points ON THE SCREEN
 * @param {*} y_range [y_low,y_high] : range of y values of points ON THE SCREEN
 * @param {*} z_eye z coordinate of your eye
 * @param {*} z_screen z coordinate of screen
 * @param {*} frame if true, draws frame
 */
function meshPlot(data,contour=false,x_range=xlim,y_range=ylim,frame=false){
    xlim = x_range
    ylim = y_range
    if(data.x==undefined){
        print("You have put a data without x array. \n Assuming data is array of more data objects")
        for(var i=0;i<data.length;i++){meshPlot(data[i])}
        return;
    }
    if(data.x.tolist){data.x = data.x.tolist()}
    if(data.y.tolist){data.y = data.y.tolist()}
    if(data.z && data.z.tolist){data.z = data.z.tolist()}
    if(data.x.shape){
        if(data.x.shape!=data.y.shape){
            print("incompatible arrays")
        }
    } else {
        var m = data.x.length
        if(m !== data.y.length){
            print("incompatible arrays")
        }
        var n = data.x[0].length
        if(n !== data.y[0].length){
            print("incompatible arrays")
        }
    }
    var z = 1
    var x = 0
    var y = 0
    c.beginPath()
    for(var i=0;i<m;i++){
        begining = true
        if(data.z){
            if(data.z[i][0]==z_screen){var z = 1}
            else{var z = (data.z[i][0]-z_eye)/(z_screen-z_eye)}
        }
        if(data.color){
            if(data.type!='scatter'){
                c.stroke()
            }
            c.beginPath()
            c.fillStyle=data.color[i]
        }
        if(z>0){
            x = x_eye + (data.x[i][0]-x_eye)/z
            y = y_eye + (data.y[i][0]-y_eye)/z
            GoTo(x,y)
            begining = false
        }
        if(data.type=="scatter"){Dot(c,X,Y,lw/(2*z))}
        for(var j=1;j<n;j++){
            if(data.z){
                if(data.z[i][j]==z_screen){z = 1}
                else{z = (data.z[i][j]-z_eye)/(z_screen-z_eye)}
            }
            if(z<=0){
                //c.stroke()
                begining = true
                continue
            }
            x = x_eye + (data.x[i][j]-x_eye)/z
            y = y_eye + (data.y[i][j]-y_eye)/z
            if(data.type=="scatter"){
                GoTo(x,y)
                Dot(c,X,Y,lw/(2*z))
            } else {
                if(begining){GoTo(x,y);begining=false}
                else {LineTo(x,y)}
            }
        }
    }

    if(!contour){
    for(var j=0;j<n;j++){
        begining = true
        if(data.z){
            if(data.z[0][j]==z_screen){var z =1}
            else{var z = (data.z[0][j]-z_eye)/(z_screen-z_eye)}
        }
        if(data.color){
            if(data.type!='scatter'){
                c.stroke()
            }
            c.beginPath()
            c.fillStyle=data.color[i]
        }
        if(z>0){
            x = x_eye + (data.x[0][j]-x_eye)/z
            y = y_eye + (data.y[0][j]-y_eye)/z
            GoTo(x,y)
            begining = false
        }
        if(data.type=="scatter"){Dot(c,X,Y,lw/(2*z))}
        for(var i=1;i<m;i++){
            if(data.z){
                if(data.z[i][j]==z_screen){z = 1}
                else{z = (data.z[i][j]-z_eye)/(z_screen-z_eye)}
            }
            if(z<=0){
                //c.stroke()
                begining = true
                continue
            }
            x = x_eye + (data.x[i][j]-x_eye)/z
            y = y_eye + (data.y[i][j]-y_eye)/z
            if(data.type=="scatter"){
                GoTo(x,y)
                Dot(c,X,Y,lw/(2*z))
            } else {
                if(begining){GoTo(x,y);begining=false}
                else{LineTo(x,y)}
            }
        }
    }
    }

    if(data.type!='scatter'){
        c.stroke()
    }
    Remember()
    if(frame){Frame()}
}
/**
 * @param {*} A Angle of rotation (radians)
 * @param {*} W Axis of rotation (x,y,z). Not specifying axis will make the z axis the axis of rotation
 * @returns Transfomation function
 */
function RotM(A,W){
    return Matrix(RM(A,W))
}
/**
 * Transforms a "data" object using a function
 * @param {*} data mesh or line 
 * @param {*} f Transformation function that takes in array arr and index i and alters the value of arr[i]
 */
function Transform(data,f,use=false){
    if(!use){
    for(var i=0;i<data.x.length;i++){
        if(typeof(data.x[i])==='object'){
            tempD.x = data.x[i]
            if(data.y){
                tempD.y = data.y[i]
            }
            if(data.z){
                tempD.z = data.z[i]
            }
            Transform(tempD,f)
        } else {
            f(data,i)
        }
    }
    }else{
        for(var i=0;i<data.x.length;i++){
            if(typeof(data.x[i])==='object'){
                tempD.x = data.x[i]
                tempD2.x = use.x[i]
                if(data.y){
                    tempD.y = data.y[i]
                    tempD2.y = use.y[i]
                }
                if(data.z){
                    tempD.z = data.z[i]
                    tempD2.z = use.z[i]
                }
                Transform(tempD,f,tempD2)
            } else {
                f(data,i,use)
            }
        }
    }
}
function Torus(R,r){
    return (function(data,i,use=false){
        if(!use){use=data}
        var x = use.x[i]
        var y = use.y[i]
        data.x[i] = (R+r*Math.cos(x))*Math.cos(y)
        data.y[i] = (R+r*Math.cos(x))*Math.sin(y)
        data.z[i] = r*Math.sin(x)
    })
}
/**
 * Converts a matrix into a transformation function
 * @param {*} M The matrix to be used
 * @returns A Transformation function
 */
function Matrix(M){
    return (function(data,i,use=false){
        if(!use){use=data}
        var x = use.x[i]
        var y = use.y[i]
        if(M.length===2){
                data.x[i] = M[0][0]*x + M[0][1]*y
                data.y[i] = M[1][0]*x + M[1][1]*y
        } else {
                var z = use.z[i]
                data.x[i] = M[0][0]*x + M[0][1]*y + M[0][2]*z
                data.y[i] = M[1][0]*x + M[1][1]*y + M[1][2]*z
                data.z[i] = M[2][0]*x + M[2][1]*y + M[2][2]*z
        }
    })
}
/**
 * @param {*} A Angle of rotation (in radians)
 * @param {*} W Axis about which rotation should happen (x,y,z)
 * @returns A 3D or 2D rotation matrix
 */
function RM(A,W){
    var cA = Math.cos(A)
    var sA = Math.sin(A) 
    if(W){
        var x = W[0]
        var y = W[1]
        var z = W[2]
        var M = [[0,0,0],[0,0,0],[0,0,0]]
        var r = (x*x + y*y + z*z)**0.5
        x = x/r
        y = y/r
        z = z/r

        M[0][0] =  cA + x*x*(1-cA)
        M[0][1] = x*y*(1-cA) - z*sA
        M[0][2] = x*y*(1-cA) + y*sA

        M[1][0] = x*y*(1-cA) + z*sA
        M[1][1] = cA + y*y*(1-cA)
        M[1][2] = y*z*(1-cA) - x*sA

        M[2][0] = x*z*(1-cA) - y*sA
        M[2][1] = y*z*(1-cA) + x*sA
        M[2][2] = cA + z*z*(1-cA)

    } else {
        var M = [[cA,-sA],[sA,cA]]
    }
    return M
}
/**
 * Creates a grid (mesh)
 * @param {*} m number of rows
 * @param {*} n number of collumns
 * @param {*} x_range [x_low, x_high] : The x values between which grid is confined
 * @param {*} y_range [y_low, y_high] : The y values between which grid is confined
 * @param {*} type "2d" or "3d"
 * @returns An object with x,y properties containing the nested arrays of x coordinates and y coordinates of points
 */
function grid(m=10,n=10,x_range=xlim,y_range=ylim,type="3d"){
    m -= 1
    n -= 1
    if(type==="2d"){
        data = {x:[],y:[]}
        for(var i=0;i<=m;i++){
            var x = []
            var y = []
            for(var j=0;j<=n;j++){
                x.push((j*x_range[1]+(n-j)*x_range[0])/n)
                y.push((i*y_range[1]+(m-i)*y_range[0])/m)
            }
            data.x.push(x)
            data.y.push(y)
        }
        return data
    }
    if(type==="3d"){
        data = {x:[],y:[],z:[]}
        for(var i=0;i<=m;i++){
            var x = []
            var y = []
            var z = []
            for(var j=0;j<=n;j++){
                x.push((j*x_range[1]+(n-j)*x_range[0])/n)
                y.push((i*y_range[1]+(m-i)*y_range[0])/m)
                z.push(0)
            }
            data.x.push(x)
            data.y.push(y)
            data.z.push(z)
        }
        return data
    }

}
function matshow(M,x0=X,y0=Y,opt={}){
    var def = {
        num:true,
        lin:false,
        brac:true,
        shade:true,
        high:1,
        low:0,
    }
    for(var option in def){
        if(opt[option]==undefined){
            opt[option] = def[option]
        }
    }
    var m = M.length
    var n = M[0].length
    var w = 0
    var h = 0
    var x = x0
    var y = y0
    var space = c.measureText(" ").width
    for(var i=0;i<m;i++){
        for(var j=0;j<n;j++){
            var lines = getLines(M[i][j].toString())
            if(lines.w + 2*space > w){
                w = lines.w + 2*space
            }
            if(lines.h + 2*space > h){
                h = lines.h + 2*space
            }
        }
    }
    y = y0
    for(var i=0;i<m;i++){
        x = x0
        for(var j=0;j<n;j++){
            var val = 255*(M[i][j]-opt.low)/(opt.high-opt.low)
            if(opt.shade){
                c.fillStyle = `rgb(${255-val},${255-val},${255-val})`
                c.fillRect(x,y,w,h)
                c.fillStyle=`rgb(${val},${val},${val})`
            }
            if(opt.num){
                text(M[i][j].toString(),x+space,y+space)
            }
            x += w
        }
        y += h
    }
    if(opt.lin){
    c.beginPath()
    y = y0
    for(var i=0;i<m+1;i++){
        c.moveTo(x0,y)
        c.lineTo(x0+w*n,y)
        y += h
    }
    x = x0
    for(var i=0;i<n+1;i++){
        c.moveTo(x,y0)
        c.lineTo(x,y0+h*m)
        x += w
    }
    c.stroke()
    }
    if(opt.brac){
    c.beginPath()

    c.moveTo(x0,y0)
    c.lineTo(x0,y0+m*h)
    c.moveTo(x0 + w*n,y0)
    c.lineTo(x0 + w*n,y0+m*h)

    c.moveTo(x0,y0)
    c.lineTo(x0+w/2,y0)
    c.moveTo(x0+n*w,y0)
    c.lineTo(x0+n*w-w/2,y0)

    c.moveTo(x0,y0+m*h)
    c.lineTo(x0+w/2,y0+m*h)
    c.moveTo(x0+n*w,y0+m*h)
    c.lineTo(x0+n*w-w/2,y0+m*h)

    c.stroke()
    }
}
function Remember(color=Color,Line_width=lw,font=Font){
    c.lineCap = 'round'
    c.fillStyle = Color = color
    c.strokeStyle = Color = color
    c.font = Font = font
    c.LineWidth = lw = Line_width
}
/**
 * Tweaks the layout
 * @param {*} s Fraction of window width taken by code area
 * @param {*} Top Topmost position in button layout
 * @param {*} Bottom Bottom position in button layout
 * @param {*} canResize If true, defaults the zoom on resize
 */
function resize(){
    cX = window.innerWidth
    cY = window.innerHeight
    fX = cX/2
    fY = cY
    fW = cX/2
    fH = cY
    can.width  = cX
    can.height = cY
    Remember()
}
/**
 * Function Animation
 * @param {*} f list of functions to call
 * @param {*} n list of number of times function is called
 * @param {*} T list of durations for which animation runs
 * @param {*} dt list of intervals between function calls
 */
function funcAnim(f,n=[100],T=[5000],dt=[false],i=0){
    if(!dt[i]){
        dt[i] = T[i]/n[i]
    }
    fa = setInterval(function(){
        if(f[i]){
            f[i]();
        }
        n[i]--;
        if(n[i]<=0){
            clearInterval(fa)
            if(i<f.length-1){
                funcAnim(f,n,T,dt,i+1)
            }
        }
    },dt[i])
}
function clear(){
    c.clearRect(0,0,cX,cY)
}
function Dot(ctx=c,x=X,y=Y) {
    var l = ctx.lineWidth
    ctx.lineWidth = 0
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = l
}
function point(x,y){
    GoTo(x,y)
    Dot()
}
function Doit(){
    clear()
    c.fillStyle = 'black'
    meshPlot(g)
    c.fillStyle = 'red'
    point(x_eye,y_eye)
}
function zoomin(){
    z_eye += 1
    z_screen += 1
    Doit()
}
function zoomout(){
    z_eye -= 1
    z_screen -= 1
    Doit()
}
function l(){
    x_eye -= 10
    Doit()
}
function r(){
    x_eye += 10
    Doit()
}
function u(){
    y_eye += 10
    Doit()
}
function d(){
    y_eye -= 10
}
LRM = RotM( 0.05,[0,1,0])
RRM = RotM(-0.05,[0,1,0])
URM = RotM( 0.05,[1,0,0])
DRM = RotM(-0.05,[1,0,0])
function L(){
    Transform(g,LRM)
}
function R(){
    Transform(g,RRM)
}
function U(){
    Transform(g,URM)
}
function D(){
    Transform(g,DRM)
}
window.onkeydown=function(e){
    if(e.key=='+'){
        z_eye += 1
        z_screen += 1
    }
    if(e.key=='-'){
        z_eye -= 1
        z_screen -= 1
    }
    if(e.key=='l'){
        x_eye -= 4
    }
    if(e.key=='r'){
        x_eye += 4
    }
    if(e.key=='u'){
        y_eye -= 4
    }
    if(e.key=='d'){
        y_eye += 4
    }
    if(e.key=='L'){
        Transform(g,RotM(0.03,[0,1,0]))
    }
    if(e.key=='R'){
        Transform(g,RotM(-0.03,[0,1,0]))
    }
    if(e.key=='U'){
        Transform(g,RotM(0.03,[1,0,0]))
    }
    if(e.key=='D'){
        Transform(g,RotM(-0.03,[1,0,0]))
    }
    Doit()
}
window.onresize=resize
window.onload=function(){
    resize()
    g = grid(100,100,[0,2*Math.PI],[-Math.PI,Math.PI],'3d')
    var R = 100
    var r = 20
    Transform(g,Torus(R,r))
    x_eye = -R
    z_eye = -2*r
    xlim = [-R-r,-R+r]
    ylim = [-r,r]
    Transform(g,RotM(Math.PI/2,[1,0,0]))
}