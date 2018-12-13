import React, {Children,Component} from "react"
import PropTypes from "prop-types"


import composable, {HasParentAndChild,} from "./composable"
import {models, ReactQuery} from "we-edit"
const {Paragraph:Base}=models

import opportunities from "./wordwrap/line-break"
import {Text as ComposedText,  Group} from "./composed"
import Frame from "./frame"

const Super=HasParentAndChild(Base)
export default class extends Super{
	static contextTypes={
		...Super.contextTypes,
		Measure: PropTypes.func,
	}
    static childContextTypes={
        ...Super.childContextTypes,
        getMyBreakOpportunities: PropTypes.func,
		getLastText: PropTypes.func
    }

	constructor(){
		super(...arguments)
		this.computed.lastText=""
		this.computed.words=0
		this.computed.atoms=[]
		this.computed.needMerge=false
	}

    getChildContext(){
        let self=this
        return {
            ...super.getChildContext(),
			getMyBreakOpportunities(text,f){
				const {lastText}=self.computed
				if(!text){
					if(text===null)
						self.computed.lastText=""
					return []
				}

				const current=opportunities(self.computed.lastText=`${lastText}${text}`)
				if(!lastText){
					self.computed.words+=current.length
					return current
				}

				const last=opportunities(lastText)
				const i=last.length-1

				let possible=current.slice(i)
				if((possible[0]=possible[0].substring(last.pop().length))==""){
					possible.splice(0,1)
				}else{
					self.computed.needMerge=true
				}
				self.computed.words+=(possible.length-1)
				return possible
            }
        }
    }

	get currentLine(){
		const {composed}=this.computed
		if(composed.length==0){
			let {context:{parent},props:{defaultStyle:{fonts,size,bold,italic}}}=this
	       const line=this._newLine(parent.nextAvailableSpace())
			composed.push(line)
		}
		return composed[composed.length-1]
	}

    _newLine({width,...space}){
		const composableWidth=(w=>{
	        const {indent:{left=0,right=0,firstLine=0}}=this.props
	        w-=(left+right)
	        if(this.computed.composed.length==0)
	            w-=firstLine

	        return w
	    })(width);

        let line=new Frame.Line({...space, width:composableWidth},{parent:this})
		if(this.props.numbering && this.computed.composed.length==0){
			let {numbering:{label}, indent:{firstLine}}=this.props
			let {defaultStyle}=new this.context.Measure(label.props)
			let hanging=-firstLine
			line.children.push(
				<Group
					descent={defaultStyle.descent}
					width={hanging}
					height={0}>
					<ComposedText {...defaultStyle}
						width={hanging}
						contentWidth={hanging}
						children={[label.props.children]}/>
				</Group>
			)
		}
		return line
    }

    appendComposed(content){
		if(this.computed.needMerge){
			let last=this.computed.atoms.pop()
			let height=Math.max(last.props.height, content.props.height)
			let descent=Math.max(last.props.descent, content.props.descent)
			let width=last.props.width+content.props.width
			this.computed.atoms.push(
				<Group {...{width,height,descent}}>
					{last}
					{React.cloneElement(content,{x:last.props.width})}
				</Group>
			)
			this.computed.needMerge=false
			return
		}
		this.computed.atoms.push(content)
    }

    onAllChildrenComposed(){//need append last non-full-width line to parent
		this.commit()
		super.onAllChildrenComposed()
    }


	/**
	* line.appendComposed can rollback to a specified atom
	* parent.appendComposed can rollback lines
	**/
	commit(start=0, end=Number.MAX_SAFE_INTEGER){
		const {context:{parent}, computed:{atoms}}=this

		const rollbackToLineWithFirstAtomIndex=at=>{
			const lines=this.computed.composed
			const i=lines.findIndex(a=>atoms.indexOf(a.first)==at)
			lines.splice(i)
			lines.push(this._newLine(parent.nextAvailableSpace()))
		}

		const appendComposedLine=bLast=>parent.appendComposed(this.createComposed2Parent(this.currentLine.commit(),bLast))
		const atomIndexOfLastNthLine=i=>atoms.indexOf(this.computed.composed[this.computed.composed.length-i].first)

		const len=this.computed.atoms.length
		const DEAD=5
		var nested=0

		const commitFrom=(start=0)=>{
			var last=0, times=0
			var next, rollbackLines
			for(let i=start,content;i<len;){
				if(i>end)
					return
				if(i==last){
					times++
					if(times>DEAD){
						throw Error(`it may be dead loop on ${i}th atoms`)
					}
				}else{
					last=i
					times=0
				}
				next=this.currentLine.appendComposed(atoms[i],i)

				if(next===false){
					if(!Number.isInteger(rollbackLines=appendComposedLine())){
						this.computed.composed.push(this._newLine(parent.nextAvailableSpace()))
						continue
					}else{
						if(rollbackLines==Frame.IMMEDIATE_STOP)
							return Frame.IMMEDIATE_STOP
						next=atomIndexOfLastNthLine(rollbackLines)(rollbackLines)
					}
				}

				if(Number.isInteger(next)){
					rollbackToLineWithFirstAtomIndex(i=next)
					continue
				}

				i++
			}

			if(++nested>DEAD){
				console.error(`it may be dead loop on since commit nested ${nested}, ignore and continue`)
				return
			}


			rollbackLines=appendComposedLine(true)
			if(Number.isInteger(rollbackLines)){
				if(rollbackLines==Frame.IMMEDIATE_STOP)
					return Frame.IMMEDIATE_STOP
				next=atomIndexOfLastNthLine(rollbackLines)
				rollbackToLineWithFirstAtomIndex(next)
				commitFrom(next)
			}

		}

		return commitFrom(start)
	}

	recommit(lastLines=[]){
		const {atoms, composed}=this.computed
		//@TODO:
		const equal=(a,b)=>a==b || a.props==b.props
		var startAtom=atoms[0]
		var endAtom=atoms[atoms.length-1]
		if(lastLines.length){
			startAtom=new ReactQuery(lastLines[0])
				.findFirst(`story`)
				.children()
				.toArray()
				.find(a=>a.props.x===undefined)
			if(!startAtom){
				debugger
			}
			startAtom=startAtom.props.atom || startAtom

			endAtom=new ReactQuery(lastLines[lastLines.length-1])
				.findFirst("story")
				.children()
				.toArray()
				.reverse()
				.find(a=>a.props.x===undefined)

			endAtom=endAtom.props.atom || endAtom
		}

		this.computed.composed=composed.slice(0,composed.findIndex(a=>equal(a.first,startAtom)))
		const start=atoms.findIndex(a=>equal(a,startAtom))
		const end=atoms.slice(start+1).findIndex(a=>equal(a,endAtom))+start+1
		return this.commit(start, end)
	}

	lineHeight(height){
		var {spacing:{lineHeight="100%",top=0, bottom=0},}=this.props
       	lineHeight=typeof(lineHeight)=='string' ? Math.ceil(height*parseInt(lineHeight)/100.0): lineHeight
	   	if(this.computed.composed.length==1){//first line
            lineHeight+=top
        }
		return lineHeight
	}

	createComposed2Parent(line,last){
		const {height, width, children, anchor,...others}=line
        let {
			spacing:{lineHeight="100%",top=0, bottom=0},
			indent:{left=0,right=0,firstLine=0},
			align,
			orphan,widow,keepWithNext,keepLines,//all recompose whole paragraph to simplify
			}=this.props

       lineHeight=typeof(lineHeight)=='string' ? height*parseInt(lineHeight)/100.0: lineHeight
	   let contentY=(lineHeight-height)/2
	   let contentX=left

        if(this.computed.composed.length==1){//first line
            lineHeight+=top
            contentY+=top
            contentX+=firstLine
        }

        if(last){//the last line
            lineHeight+=bottom
			if(align=="justify" || align=="both"){//not justify the last line
				align=undefined
			}
        }

		const pagination={orphan,widow,keepWithNext,keepLines, i:this.computed.composed.length,last}

        return (
            <Group height={lineHeight} width={width} className="line" pagination={pagination} anchor={anchor}>
                <Group x={contentX} y={contentY} width={width} height={height}>
					<Story {...{children,align}}/>
                </Group>
            </Group>
        )
    }
}

class Story extends Component{
	static displayName="story"
	render(){
		const {children, align="left"}=this.props
		const height=children.reduce((h,{props:{height}})=>Math.max(h,height),0)
		const descent=children.reduce((h,a,i)=>{
			const {props:{descent}}=a
			if(descent==undefined){
				children[i]=React.cloneElement(a,{y:-a.props.height})
			}
			return Math.max(h,descent||0)
		},0)
		const baseline=height-descent
		return (
			<Group y={baseline}>
				{this[align]()}
			</Group>
		)
	}

	left(){
		return this.props.children.reduce((state,piece,key)=>{
			const {width,x:x1}=piece.props
			const x=x1!=undefined ? x1 : state.x
			state.pieces.push(React.cloneElement(piece,{x,key}))
			state.x=x+width
			return state
		},{pieces:[],x:0}).pieces
	}

	group(right=false){
		return this.props.children
			.reduce((groups,a)=>{
				if(a.props.x!=undefined){
					if(right){
						groups.push({located:a,words:[]})
					}else{
						groups[groups.length-1].located=a
						groups.push({words:[]})
					}
				}else{
					groups[groups.length-1].words.push(a)
				}
				return groups
			},[{words:[]}])
			.map(group=>{
				let i=group.words.length-
						Array.from(group.words)
							.reverse()
							.findIndex(a=>!isWhitespace(a))

				group.endingWhitespaces=group.words.slice(i)
				group.words=group.words.slice(0,i)
				return group
			})
	}

	right(){
		return this.group(true)
			.reduceRight((state, {located,words,endingWhitespaces})=>{
				const i=state.righted.length
				endingWhitespaces.reduce((x,whitespace)=>{
					state.righted.push(React.cloneElement(whitespace,{x}))
					return x+whitespace.props.width
				},state.x)

				words.reduceRight((x,word)=>{
					x=x-word.props.width
					state.righted.splice(i,0,React.cloneElement(word,{x}))
					return x
				},state.x)

				if(located){
					state.righted.splice(i,0,located)
					state.x=located.props.x
				}
				return state
			},{x:this.props.width,righted:[]}).righted
	}

	center(){
		const contentWidth=pieces=>pieces.reduce((w,a)=>w+a.props.width,0)
		return this
			.group()
			.reduce((state, {words, endingWhitespaces,located})=>{
				const width=(located ? located.props.x : this.props.width)-state.x
				const wordsWidth=contentWidth(words)
				state.centerized.push(
					<Group x={state.x+(width-wordsWidth)/2} key={state.centerized.length}>
						{
							words.concat(endingWhitespaces).reduce((status,word,key)=>{
								status.pieces.push(React.cloneElement(word,{x:status.x,key}))
								status.x+=word.props.width
								return status
							},{x:0,pieces:[]}).pieces
						}
					</Group>
				)

				if(located){
					state.centerized.push(React.cloneElement(located,{key:state.centerized.length}))
					state.x=located.props.x+located.props.width
				}
				return state
			},{x:0, centerized:[]}).centerized
	}

	justify(){
		return this
			.group()
			.reduce((state,{words,endingWhitespaces,located})=>{
				let len=state.justified.length
				const width=(located ? located.props.x : this.props.width)-state.x
				const {whitespaces,contentWidth}=words.reduce((status,a,i)=>{
					if(isWhitespace(a)){
						status.whitespaces.push(i)
					}else{
						status.contentWidth+=a.props.width
					}
					return status
				},{contentWidth:0,whitespaces:[]})
				const whitespaceWidth=whitespaces.length>0 ? (width-contentWidth)/whitespaces.length : 0
				words.concat(endingWhitespaces).reduce((x,word,i)=>{
					state.justified.push(React.cloneElement(word,{x,key:len++}))
					return x+(whitespaces.includes(i) ? whitespaceWidth : word.props.width)
				},state.x)

				if(located){
					state.justified.push(React.cloneElement(located,{key:len++}))
					state.x=located.props.x+located.props.width
				}
				return state
			},{x:0,justified:[]}).justified
	}

	both(){
		return this.justify()
	}
}


function isWhitespace(a,/*$=new Query(a)*/){
	//return $.prop("minWidth")==0 && $.findFirst(".whitespace")

	if(a.props.minWidth==0){
		while(a && a.props.className!="whitespace"){
			try{
				a=React.Children.only(a.props.children)
			}catch(e){
				return false
			}
		}
		return !!a
	}
	return false
}
