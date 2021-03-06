import React from "react"
import {Group} from "../composed"

import {HasParentAndChild} from "../composable"
import {dom} from "we-edit"

/**
* xy for Positioning
* wrap boundary must be provided by children content, and then pass to frame
*/
export default class Anchor extends HasParentAndChild(dom.Anchor){
    createComposed2Parent(content){
        var {width,height,geometry}=content.props
        const {margin:{left=0,right=0,top=0,bottom=0}={}, wrap, x:X, y:Y}=this.props
        this.width=width+=(left+right)
        this.height=height+=(top+bottom)
        return (
            <Group children={content}
                anchor={space=>{
                    const size={width:this.width, height:this.height}  
                    var x=space.anchor({align:"left",...X},size,space)
                    var y=space.anchor({align:"top",...Y},size,space)
                    
                    x=x-left, y=y-top
                    if(geometry && geometry.origin){
                        x-=geometry.origin.x
                        y-=geometry.origin.y
                    }

                    const wrapFunc=(fn=>{
                        if(!fn)
                            return 
                        if(wrap.mode=="Square" || wrap.mode=="TopAndBottom")
                            return line=>fn.call(this, line, {bounds:()=>({left:x,top:y,right:x+width,bottom:y+height})})
                        return line=>fn.call(this, line, geometry.clone().translate(x,y))
                    })(wrap && (typeof(wrap)=="function" ? wrap : this[`wrap${wrap.mode}`]));

                    return (
                        <Group {...{
                            x,y,
                            wrap:wrapFunc,
                            geometry:{x,y,width,height},
                            "data-content":this.props.id,"data-type":this.getComposeType()}}>
                            <Group x={left} y={top}>
                                {content}
                            </Group>
                        </Group>
                    )
                }
            }
            />
        )
    }

    applyWrapText(x1,x2, x, X){
        const {wrap:{wrapText}}=this.props
        const get=type=>{
            switch(type){
            case "left":
                return {x,width:x2-x}
            case "right":
                return {x:x1,width:X-x1}
            case "largest":
                return get((x-x1)>=(x2-X) ? "left" : "right")
            default:
                return {x, width:X-x}
            }
        }

        return get(wrapText)
    }

    wrapSquare({x1,x2,y2:y,y1=y},geometry){
        const {wrap:{mode, wrapText},margin:{right:mr=0, left:ml=0}={}}=this.props
        const {left,top,right,bottom}=geometry.bounds()
        if(y>=top && y<=bottom){
            if(!(x2<=left || x1>=right)){
                if(y1!==bottom){
                    return Object.assign(this.applyWrapText(x1,x2,left-ml, right+mr),{y:bottom})
                }
            }
        }
    }

    wrapTight(line,geometry){
        const {margin:{left=0,right=0}}=this.props
        const {x1,x2, y2}=line
        const points=geometry.intersects({x1,x2,y2,y1:y2}).sort((a,b)=>a.x-b.x)
        if(points.length>2){
            points.splice(1,points.length-1-1)
        }
        if(points.length>0){
            return this.applyWrapText(x1,x2,points[0].x-left,points.pop().x+right)
        }
    }

    wrapThrough(line,geometry){
        return this.wrapTight(...arguments)
    }

    wrapClear({x1,x2,y2:y, y1=y},geometry){
        const {left,top,right,bottom}=geometry.bounds()
        if(y>=top && y<=bottom){
            if(y1!==bottom){
                return {x:x1,width:x2-x1,y:bottom,type:"clear"}
            }
        }
    }

    wrapTopAndBottom(){
        return this.wrapClear(...arguments)
    }
}
