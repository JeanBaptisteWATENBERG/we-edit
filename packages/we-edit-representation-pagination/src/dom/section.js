import React,{Children} from "react"
import PropTypes from "prop-types"
import {HasParentAndChild, editable} from "../composable"
import {dom} from "we-edit"
import Frame from "./frame"

const Super=HasParentAndChild(dom.Section)
class Section extends Super{
	static defaultProps={
		...Super.defaultProps,
		createLayout(props,context){
			const {layout}=this.props
			if(layout){
				return new this.Fission({...layout, ...props},context)
			}else{
				throw new Error("section has no createLayout")
			}
		}
	}

	static childContextTypes={
		...Super.childContextTypes,
        prevLayout: PropTypes.func,
	}

    /**
     * why use static function to inherit??? because Frame is in instance's context
     * @param {*} Frame 
     */
	static fissureLike(Frame){
		return Frame
    }
    
	constructor(){
		super(...arguments)
		this.computed.named={}
		const Fission=class extends this.constructor.fissureLike(Frame){
            createComposed2Parent(){
                const {props:{i,margin}}=this
                return React.cloneElement(super.createComposed2Parent(...arguments),{margin,i,key:i})
            }
		}
		Object.defineProperties(this,{
			Fission:{
				get:()=>Fission
			},
			isFissionable:{
				get:()=>true,
			},
		})
    }
	get current(){
        if(this.computed.composed.length==0){
            const a=this.createLayout()
            this.computed.composed.push(a)
            this.context.parent.appendComposed(this.createComposed2Parent(a))
        }
		return this.computed.composed[this.computed.composed.length-1]
	}    

    getChildContext(){
        const self=this
        return {
            ...super.getChildContext(),
            prevLayout(ref){
                const {composed}=self.computed
                return composed[composed.indexOf(ref)-1]
            }
        }
    }

	named(name){
		return this.computed.named[name]
	}


	/**page index, or undefined */
	get topIndex(){
		var current=this.context.parent
		while(current){
			if(current.isFrame || current.isFissionable)
				return 
			if(!current.context || !current.context.parent)
				return current.computed.composed.length
		}
	}

    /**
     * ** create is pure, so you have to append to your composed and parent manually every time create called***
     * create a block layout engine with a ensured space {left,right,blockOffset,height,wrappees}
     * when current space is full, it would be called
     * @param {*} props
     * @param {*} context 
     * @param {*} requiredSpace 
     */
    createLayout(props={},context={},requiredSpace){
		const allProps={...props,
			id:this.props.id, 
			i:this.computed.composed.length, 
			named:this.named.bind(this),
		}
		const I=this.topIndex
		if(typeof(I)=="number")
			allProps.I=I
		return this.props.createLayout.bind(this)(
			allProps,
            {...context,parent:this,getComposer:id=>this.context.getComposer(id)}
        )
    }

    createComposed2Parent(a){
        return a
    }

    /**
     * it proxy the call to current layout
     * if current layout has no required space, a new Layout will be created
     * @param {*} required 
     */
    nextAvailableSpace(required){
        const space=this.current.nextAvailableSpace(...arguments)
        if(!space){
            const a=this.createLayout(undefined,{frame:space.frame},required)
            this.computed.composed.push(a)
            this.context.parent.appendComposed(this.createComposed2Parent(a))
            return this.nextAvailableSpace(...arguments)
        }
        return space
    }

    /**
     * named is supported to be kept
     * @param {*} composedChildenContent 
     * @returns
     * number: to rollback last number of lines
     */
    appendComposed({props:{named,height}}){
        if(named){
            this.computed.named[named]=arguments[0]
            return
        }else{
            const appended=this.current.appendComposed(...arguments)
            if(appended===false){
                const a=this.createLayout(undefined, undefined,{height})
                this.computed.composed.push(a)
                this.context.parent.appendComposed(this.createComposed2Parent(a))
                return 1//recompose current line in case different availableSpace
            }else if(Number.isInteger(appended)){
                return appended
            }
        }
	}
}

export default class EditableSection extends editable(Section,{stoppable:true}){
	/**
	 * lastComposed==composed
	 */
	cancelUnusableLastComposed(nextProps){
		const changed=nextProps.hash!=this.props.hash
		if(changed){
			this._cancelChangedPart(...arguments)
		}
		this._cancelUntilLastAllChildrenComposed(...arguments)
	}

	/**
	 * both composed and lastComposed refer to fissions, check createComposed2Parent
	 * 
	 */
	appendLastComposed(){
		const lastComposed=this.computed.lastComposed
		//clear last composed
		this.computed.composed=[]
		this.computed.lastComposed=[]
		
		//append last composed fissions one by one
		const spaceChangedAt=lastComposed.findIndex((fission,i,_,$,isLast=i==lastComposed.length-1)=>{
			if(isLast&&fission.isEmpty()){
				//last empty fission is useless for cache
				return true
			}
				
			const current=this.createLayout(false)
			if(fission.getSpace().equals(current.getSpace())){
				this.computed.composed.splice(i,1,fission)
				this.context.parent.appendComposed(this.createComposed2Parent(fission))
				return false
			}
			return true
		})


		if(spaceChangedAt==0){
			//clear all computed
			this.anchors=[]
			super.cancelUnusableLastComposed()
			return false
		}else if(spaceChangedAt==-1){
			if(this.isAllChildrenComposed()){
				return true
			}
			//continue from last
		}else{
			delete this.computed.allComposed
			//continue from last
		}

		//is it possible that this.current is empty? last empty fission is removed, so not possible
		const lastId=this.current.lastLine.props["data-content"]
		return Children.toArray(this.props.children).findIndex(a=>a && a.props.id==lastId)
	}

	_cancelChangedPart(next){
		var lineIndex=-1
		const childrenNeedRecompose=this.childrenNeedRecompose(next,this.props)
		const fissionIndex=this.computed.lastComposed.findIndex(({lines})=>{
			return (lineIndex=lines.findIndex(a=>childrenNeedRecompose.includes(this.childIdOf(a))))!=-1
		})

		this._keepLastComposedUntil(fissionIndex,lineIndex)
	}

	
    /**
     * cacheable API
     * compose rule: always compose all children, and content composing is stoppable 
     * both composed and lastComposed refer to fissions
     */
	_cancelUntilLastAllChildrenComposed(){
		var lineIndex=-1
        const fissionIndex=this.computed.lastComposed.findLastIndex(({lines})=>{
			return (lineIndex=lines.findLastIndex((a,i,_,$,id=this.childIdOf(a))=>{
				const composer=this.context.getComposer(id)
				return composer && composer.isAllChildrenComposed()
			}))!=-1
		})
		this._keepLastComposedUntil(fissionIndex,lineIndex+1)
	}

	_keepLastComposedUntil(fissionIndex,lineIndex){
		const {lastComposed}=this.computed
		if(fissionIndex==-1 || 
			(fissionIndex==lastComposed.length-1 && lineIndex>=lastComposed[fissionIndex].lines.length)){
			return 
		}
		delete this.computed.allComposed
		this.computed.lastComposed=lastComposed.slice(0,fissionIndex+1)
		this.computed.lastComposed[fissionIndex].removeFrom(lineIndex)
	}
}
