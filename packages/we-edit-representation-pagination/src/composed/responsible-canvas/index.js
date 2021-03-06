import React, {Component,Fragment} from "react"
import PropTypes from "prop-types"
import {ACTION, Cursor, Selection,ContentQuery, getSelection} from "we-edit"

import Canvas from "../canvas"
import SelectionShape from "./selection-shape"
import CursorShape from "./cursor-shape"
import WhenSelectionChangeNotifier from "./when-selection-change-notifier"
import Positioning from "./positioning"
import ComposeMoreTrigger from "./compose-more-trigger"
import DefineShapes from "./define-shapes"

/**
 * must provide the following 
 * 1. for Positioning: pages, getComposer, getContent, asCanvasPoint, asViewportPoint, pageXY(I)
 * 2. for Responsible Events: 
 */
class Responsible extends Component{
    static displayName="responsible-composed-document-default-canvas"
    static Canvas=Canvas
    static ComposeMoreTrigger=ComposeMoreTrigger
    static Positioning=Positioning
    static propTypes={
        pageGap: PropTypes.number,
        screenBuffer: PropTypes.number,
        scale: PropTypes.number,  
		viewport: PropTypes.shape({
            height:PropTypes.number,
            width: PropTypes.number,
            node: PropTypes.instanceOf(Element),
		}),        
        document: PropTypes.object,
    }

    static defaultProps={
		pageGap:12,
        screenBuffer: 1,
        scale:1,
    }
    
    static contextTypes={
        onContextMenu: PropTypes.func,
        activeDocStore: PropTypes.any,
    }

    static childContextTypes={
        positioning:PropTypes.object,
    }
    
    static getDerivedStateFromProps({document,...me}){
        const {props:{editable,canvasId,content,contentHash,viewport=me.viewport,screenBuffer=me.screenBuffer,},state:{y=0}}=document
        return {...Canvas.getDerivedStateFromProps(...arguments), editable,canvasId,content,contentHash,viewport,screenBuffer,composed4Y:y}
    }

    constructor(){
        super(...arguments)
        this.state={}
        this.getComposer=this.getComposer.bind(this)
        this.getContent=this.getContent.bind(this)
        const Positioning=this.constructor.Positioning
        const SafePositioning=Positioning.makeSafe(Positioning)
        this.positioning=new SafePositioning(this)
    }

    getChildContext(){
        return {
            positioning:this.positioning
        }
    }

    /**the following API must be provided to Positioning */
    get pages(){
        return this.state.pages
    }

    getComposer(id){
		return this.props.document.getComposer(id)
	}

	getContent(id){
        return ContentQuery.fromContent(this.state.content,  id ? `#${id}`  : undefined)
    }
    
    asCanvasPoint({left,top}){
        const point=this.canvas.createSVGPoint()
        point.x=left,point.y=top
        const {x,y}=point.matrixTransform(this.canvas.getScreenCTM().inverse())
        return {x, y}
    }

    asViewportPoint({x,y}){
        let point=this.canvas.createSVGPoint()
        point.x=x,point.y=y
        let location=point.matrixTransform(this.canvas.getScreenCTM())
        return {left:location.x, top:location.y}
    }
    
    pageXY(I=0){
        const rect=this.constructor.Canvas.pageRect(I,this.canvas)
        return !rect ? {x:0,y:0} : this.asCanvasPoint(rect)
    }
    ////End Positioning API/
    
    get dispatch(){
        return this.context.activeDocStore.dispatch
    }

    get selectionChangeNotifier(){
        if(this.refs.selectionChangeNotifier)
            return this.refs.selectionChangeNotifier.getWrappedInstance()
    }

    get selecting(){
        if(this.refs.selecting)
            return this.refs.selecting.getWrappedInstance()
    }

	get selection(){
        return getSelection(this.context.activeDocStore.getState())
	}

	get cursor(){
		const {cursorAt, ...a}=this.selection
        return {...a[cursorAt]}
    }

    __composedY(){
        const {pages, pageGap}=this.state
        return this.constructor.Canvas.composedY(pages, pageGap)
    }
    
    //provide to document to query 
    availableBlockSize(){
        const {scale, composed4Y=0,screenBuffer,viewport:{height,node:{scrollTop}}}=this.state
        const composedY=this.__composedY() * scale
        return Math.max(0,(Math.max(scrollTop,composed4Y)+height+screenBuffer*height)-composedY)
    }

    render(){
        const {props:{children,document}, state:{editable=true,scale,pageGap,pages,precision}}=this
        const noCursor=editable && editable.cursor===false
        const eventHandlers=!noCursor ? this.eventHandlers  : {}
        const notifySelectionChangeNotifier=callback=>{
			!this.selectionChangeNotifier ? callback() : this.selectionChangeNotifier.setState({composedContent:null},callback)
        }
        const {Canvas, ComposeMoreTrigger}=this.constructor
        return (
            <Canvas 
                {...{scale,pageGap,pages,precision,document,paper:true}}
                innerRef={a=>{this.canvas=a}}
                {...eventHandlers}>
                <ComposeMoreTrigger
                    getComposedY={()=>this.__composedY()}
                    isSelectionComposed={selection=>document.isSelectionComposed(selection)}
                    compose4Selection={a=>{
                        if(!document.isAllChildrenComposed()){
                            notifySelectionChangeNotifier(selection=>document.compose4Selection(selection))
                        }
                    }}
                    compose4Scroll={y=>{
                        if(!document.isAllChildrenComposed()){
                            notifySelectionChangeNotifier(()=>document.compose4Scroll(y))
                        }
                    }}
                />    
                <DefineShapes/>
				<Fragment>
                    {children}
					<Cursor
                        keys={{
                            37:e=>this.onKeyArrowLeft(e),//move left
			                39:e=>this.onKeyArrowRight(e),//move right
                            38:e=>this.onKeyArrowUp(e),//move up
                            40:e=>this.onKeyArrowDown(e),//move down
                        }}>
                        <CursorShape scrollNodeIntoView={node=>this.scrollNodeIntoView(node)}/>
                    </Cursor>
                    <Selection >
                        <SelectionShape ref={"selecting"}/>
                    </Selection>
                    <WhenSelectionChangeNotifier canvas={this} shouldNotify={()=>this.shouldCursorOrSelectionChange()} ref="selectionChangeNotifier"/>
				</Fragment>
            </Canvas>
        )
    }

    shouldCursorOrSelectionChange(){
        return true
    }

    __statistics(){
        const {props:{document}}=this
        this.dispatch(ACTION.Statistics({
			pages:this.pages.length,
			allComposed:document.isAllChildrenComposed(),
			words: Array.from(document.composers.values()).filter(a=>!!a)
				.reduce((words,a)=>words+=(a.atoms ? a.atoms.length : 0),0)
		}))
    }

    componentDidUpdate(){
        this.__statistics()
        this.selectionChangeNotifier && this.selectionChangeNotifier.setState({composedContent:this.state.contentHash})
    }

    componentDidMount(){
        this.active()
        this.componentDidUpdate()
    }

    active(){
		this.dispatch(ACTION.Cursor.ACTIVE(this.state.canvasId))
    }    
}

export default class EventResponsible extends Responsible{
    constructor(){
        super(...arguments)
        this.eventHandlers="onClick,onDoubleClick,onContextMenu,onMouseDown,onMouseMove,onMouseUp".split(",")
            .reduce((handlers,key)=>{
                if(key in this){
                    handlers[key]=this[key]=this[key].bind(this)
                }else{
                    console.warn(`responsible canvas doesn't implemented ${key} event`)
                }
                return handlers
            },{})
        this.__mouseDownFlag={}
    }

    __onClick({shiftKey:selecting, clientX:left,clientY:top}, doubleClicked=false){
		const {id,at}=this.positioning.around(left, top)
		if(id){
            if(at==undefined){
                this.dispatch(ACTION.Selection.SELECT(id,0,id,1))
            }else{
    			if(!selecting){
                    if(doubleClicked){
                        const {start,end}=this.positioning.extendWord(id,at)
                        if(start && end){
                            this.dispatch(ACTION.Selection.SELECT(start.id,start.at, end.id, end.at))
                        }else{
                            this.dispatch(ACTION.Cursor.AT(id,at))
                        }
                    }else{
        				this.dispatch(ACTION.Cursor.AT(id,at))
                    }
    			}else{
    				let {end}=this.selection
    				let {left,top}=this.positioning.position(id,at)
    				let {left:left1,top:top1}=this.positioning.position(end.id,end.at)
    				if(top<top1 || (top==top1 && left<=left1)){
    					this.dispatch(ACTION.Selection.START_AT(id,at))
    				}else{
                        const a=this.positioning.normalizeSelection(a.end,{id,at})
    					this.dispatch(ACTION.Selection.SELECT(a.start.id,a.start.at, a.end.id, a.end.at))
    				}
    			}
            }
		}

        this.active()
    }

    __onKeyArrow(id,at,selecting){
        if(!selecting){
            this.dispatch(ACTION.Cursor.AT(id,at))
        }else{
            const {cursorAt,...a}=this.selection
            a[cursorAt]={id,at}
            const {start,end}=this.positioning.normalizeSelection(a.start,a.end)
            this.dispatch(ACTION.Selection.SELECT(start.id, start.at, end.id,end.at))
        }
    }

    __shouldIgnoreMouseDownEvent({clientX,clientY}){
        return clientX==this.__mouseDownFlag.clientX && clientY==this.__mouseDownFlag.clientY
    }

    onClick(e){
        if(!this.__mouseDownFlag.selected){
            this.__mouseDownFlag.selected=false
            this.__onClick(e)
        }
    }

    onContextMenu(e){
        const {context:{onContextMenu}}=this
        this.__onClick(e)
        onContextMenu && onContextMenu(e)
    }

    onDoubleClick(e){
        if(!this.__mouseDownFlag.selected){
            this.__mouseDownFlag.selected=false
            this.__onClick(e,true)
        }
    }

    onMouseDown({clientX,clientY}){
        console.log("svg mouse down")
        this.__mouseDownFlag={clientX,clientY}
    }

    onMouseMove(e){
        if(!(e.buttons&0x1)){
            return
        }
        if(this.__shouldIgnoreMouseDownEvent(e)){
            return
        }

        const {id,at}=this.positioning.around(e.clientX,e.clientY)
        if(id){
            const end={id,at}
            let {start=end}=this.selecting.state
            const rects=start==end ? [] : this.positioning.getRangeRects(start, end)
            this.selecting.setState({start:start||end, end, rects, selecting:true})
        }
    }

    onMouseUp(e){
        if(this.__shouldIgnoreMouseDownEvent(e)){
            return
        }
        var {start,end}=this.selecting.state
        if(start && end){
            this.selecting.setState({start:undefined, end:undefined, rects:undefined,selecting:false})
            ;({start,end}=this.positioning.normalizeSelection(start,end));
            this.dispatch(ACTION.Selection.SELECT(start.id,start.at,end.id,end.at))
            this.__mouseDownFlag.selected=true
        }
    }

	onKeyArrowUp({shiftKey:selecting}){
        const cursor=this.cursor
		const {id, at}=this.positioning.prevLine(cursor.id,cursor.at)
        if(id){
    		this.__onKeyArrow(id,at,selecting)
        }
	}

	onKeyArrowDown({shiftKey:selecting}){
		const cursor=this.cursor
		const {id, at}=this.positioning.nextLine(cursor.id,cursor.at)
        if(id){
            this.__onKeyArrow(id,at,selecting)
        }
    }

    onKeyArrowLeft(e){
        const {metaKey,ctrlKey,shiftKey:selecting}=e
        if(metaKey||ctrlKey){
            const cursor=this.cursor
            const start=this.positioning.positionToLineStart(cursor.id,cursor.at)
            if(cursor.id!=start.id || cursor.at!=start.at){
                this.__onKeyArrow(start.id, start.at, selecting)
                return 
            }
        }
        this.dispatch(ACTION.Cursor.BACKWARD(e))
    }

    onKeyArrowRight(e){
        const {metaKey,ctrlKey,shiftKey:selecting}=e
        if(metaKey||ctrlKey){
            const cursor=this.cursor
            const end=this.positioning.positionToLineEnd(cursor.id,cursor.at)
            if(cursor.id!=end.id || cursor.at!=end.at){
                this.__onKeyArrow(end.id, end.at, selecting)
                return 
            }
        }
        this.dispatch(ACTION.Cursor.FORWARD(e))
    }
}


