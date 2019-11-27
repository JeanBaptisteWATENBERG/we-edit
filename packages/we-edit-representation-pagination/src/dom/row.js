import React,{PureComponent as Component} from "react"
import {dom, ReactQuery} from "we-edit"

import {Group} from "../composed"

import {HasParentAndChild} from "../composable"
const Super=HasParentAndChild(dom.Row)

/**
 * terms:
 * Rank: a composed line, a row may have more than one rank, rank apply vertAlign
 * Slot: a composed cell segment, 
 * create rank only when cell request next availableSpace
 * when add rank to parent layout?
 * 2. all children composed, then blockOffset can't be determined, so it's not possible
 * 1. first cell segment
 * ***
 * >rank's height is not always correct, how to fix it??? 
 * ***every time new cell segment appended, the height can be fixed
 * >why rank's height must be fixed? 
 * ***border
 * 
 * 
 * Row defines each cell height and width
 * 
 * computed.composed is 2-d matrix, [col][slot,slot,...]
 * compued.spaces is [rank space,...]
 * rank		space\col	col1	col2 	...
 * rank1	space1		slot11		
 * rank2	space2		slot12	slot21
 * ...		...	 		...	 	...
 * 
 * 
 * when append Rank to space, #1 is simple and chosen
 * 1> request rank space, then add empty Rank placeholder, then adjust rank every time a slot committed
 * 2> before requesting rank space, commit last Rank placeholder, do what #1 would do
 * 3> all children composed : affect blockOffset, so it's NOT possible
*/
export default class __$1 extends Super{
	constructor(){
		super(...arguments)
		this.computed.spaces=[]
		this.slots=this.computed.slots=[]
		Object.defineProperties(this,{
			columns:{
				enumerable:true,
				configurable:true,
				get(){
					return this.computed.composed
				},
				set(value){
					this.computed.composed=value
				}
			},
			spaces:{
				enumerable:true,
				configurable:true,
				get(){
					return this.computed.spaces
				},
				set(value){
					this.computed.spaces=value
				}
			}
		})
	}
	get currentColumn(){
		if(this.columns.length==0)
			this.columns.push([])
		return this.columns[this.columns.length-1]
	}

	get totalRank(){
		return this.columns.reduce((c,a)=>Math.max(c,a.length),0)
	}

	get currentSpace(){
		return this.spaces[this.currentColumn.length-1]
	}
	
	get width(){//used by calc row range
		return this.closest("table").props.width
	}

	cellId(cell){
		if(cell){
			return new ReactQuery(cell)
				.findFirst(`[data-type="cell"]`)
				.attr("data-content")
		}
	}

	getColIndexForCell(id){

	}

	getRankIndexForCell(id){

	}

	/**
	 * rank space must already be ready
	 * put it into correct column[i].push(cell)
	 * 
	 * @param {*} cell 
	 */
	appendComposed(cell){
		/*
		this.computed.slots.push(cell)
		const colIndex=this.getColIndexForCell(cellId)
		const rankIndex=this.getRankIndexForCell(cellId)
		this.columns[colIndex].push(cell)
		this.rankSpaces[rankIndex].frame.lastLine.rank.children[colIndex]=cell
		
		this.computed.slots.push(cell)
		*/
		if(!this.currentColumn[0]){
			this.currentColumn.push(cell)
		}else if(this.cellId(this.currentColumn[0])==this.cellId(cell)){
			this.currentColumn.push(cell)
		}else{
			this.columns.push([cell])
		}
		if(!this.currentSpace)
			return

		this.injectCellIntoRankAndResetRankHeight(cell)
	}

	/**
	 * as name explained
	 * it's based on Rank render structure
	 * > rendered rank's children is mutable array
	 * 
	 * @param {*} slot 
	 */
	injectCellIntoRankAndResetRankHeight(slot){
		const lastLine=this.currentSpace.frame.lastLine
		if(!lastLine){
			return 
		}
		const {first:rank,parents}=new ReactQuery(lastLine).findFirstAndParents(`[data-content="${this.props.id}"]`)
		if(!rank.length)
			return
		
		const slots=rank.attr("children")
		//inject 
		slots[this.columns.length-1]=slot

		/** set height changes from rank to block line*/
		const rankWithNewHeight=changeHeightUp(this.getHeight(slots),rank.get(0),parents)
		this.currentSpace.frame.lines.splice(-1,1,rankWithNewHeight)
	}

	/**
	 * request a rank space from up, and then
	 * create space for each cell
	 * when a cell request space, we need at first determin which rank, then we can determin 
	 * 1. request rank space from up
	 * 2. or calc cell space from rank space
	 * How to determin which rank when cell request space???
	 * ** use cellId to query rank
	 * 
	 * don't use required height to request space, since later cell slot may fit in
	 * but use row height to request block size space if height defined
	 * if there's no cell slot fit in, we can delete the whole rank later 
	 * 
	 * **every time requesting space, a rank placeholder height=0 would be appended to take the space
	 * **then height will be corrected every time a slot appended
	 * @param {*} param0 
	 */
	nextAvailableSpace({height:minHeight=0,id:cellId}){
		/*
		const {cols,height}=this.props
		const colIndex=this.getColIndexForCell(cellId)
		const rankIndex=this.getRankIndexForCell(cellId)
		let rankSpace=this.rankSpaces[rankIndex]
		if(!rankSpace){
			//**request new rank space
			this.rankSpaces.push(rankSpace=super.nextAvailableSpace({height}))
			this.context.parent.appendComposed(this.createComposed2Parent())
			//append a rank placeholder
		}else if(rankSpace.height<minHeight){
			//**rankSpace can't meet required
			//use next rank
			if(!(rankSpace=this.rankSpaces[rankIndex+1])){
				this.rankSpaces.push(rankSpace=super.nextAvailableSpace({height}))
				this.context.parent.appendComposed(this.createComposed2Parent())
			}
		}
		return rankSpace.clone(cols[colIndex])
		*/

		var space=this.currentSpace, col
		const {cols,keepLines,height}=this.props
		if(!this.currentColumn[0]){
			//requesting for first slot, request space
			this.spaces[0]=space=super.nextAvailableSpace({height})
			col=cols[0]
		}else if(this.cellId(this.currentColumn[0])==cellId){
			//requesting for current column
			if(this.currentColumn.length+1>this.totalRank){
				//no rank space, commit last rank, and request space
				const rank=this.createComposed2Parent()
				if(1==this.context.parent.appendComposed(rank)){
					if(1==this.context.parent.appendComposed(rank)){
						//could it happen?
						console.error(`row[${this.props.id}] can't be appended with rollback again, ignore`)
					}
				}
				//use requested rank space
				this.spaces.push(space=super.nextAvailableSpace({height}))
			}else{
				//rank space exists, use existing rank space
				space=this.spaces[this.currentColumn.length]
				if(space.height<minHeight){
					//space can't meet required, request space up
					//REPACE exist ??? valid ONLY WHEN rank has not been appended to space ??? valid
					space=this.spaces[this.currentColumn.length]=super.nextAvailableSpace({height})
				}
			}
			col=cols[this.columns.length-1]
		}else{//next column
			space=this.spaces[0]
			if(space.height<minHeight){
				//space can't meet required, request space up
				//REPACE exist ??? valid ONLY WHEN rank has not been appended to space ??? valid
				space=this.spaces[0]=super.nextAvailableSpace({height})
			}
			col=cols[this.columns.length]
		}
		
		const {left}=space
		const {x=0,width}=col
		return space.clone({
			left:left+x,
			right:left+x+width,
			height:keepLines ? Number.MAX_SAFE_INTEGER : space.height,
		})
	}

	/**
	 * insert empty slot for borders in rank
	 * @param {*} rank 
	 * @param {*} parents 
	 */
	injectEmptyCellIntoRank(rank){
		const height=rank.attr("height")
		const slots=rank.attr("children")
		//fill null for unfilled slot seat
		slots.splice(slots.length,0,...new Array(this.props.cols.length-slots.length).fill(null))
		//replace null with each column's first slot ???
		slots.forEach((a,j)=>{
			!a && (slots[j]=React.cloneElement(this.columns[j][0],{height,frame:undefined}))
		})

		//fix height of each cell to correctly show borders
		slots.forEach((a,j)=>{
			const {first:cell,parents}=new ReactQuery(a).findFirstAndParents(`[data-type="cell"]`)
			slots[j]=changeHeightUp(height, cell.get(0), parents)
		})
	}

	onAllChildrenComposed(){
		(()=>{//append the last rank
			const unappendedCount=this.ranks-this.currentColumn.length
			for(let i=unappendedCount;i>0;i--)
				this.currentColumn.push(null)

			const lastRank=this.createComposed2Parent(true)
			if(1==this.context.parent.appendComposed(lastRank)){
				if(1==this.context.parent.appendComposed(lastRank)){
					//could it happen?
					console.error(`row[${this.props.id}] can't be appended with rollback again, ignore`)
				}
			}
			if(unappendedCount>0){
				this.currentColumn.splice(-unappendedCount)
			}
		})();

		//fill empty cell for each rank, and
		this.spaces.forEach(({frame})=>{
			const {first:rank,parents}=new ReactQuery(frame.lastLine)
				.findFirstAndParents(`[data-content="${this.props.id}"]`)
			if(!rank.length){
				throw new Error("weired table row without rank")
			}
			this.injectEmptyCellIntoRank(rank,parents,frame)
		})
		super.onAllChildrenComposed()
	}

	createComposed2Parent(last=false){
		const {props:{cols}, width, computed:{composed:columns, spaces}}=this
		//const {height}=spaces[spaces.length-1]
		//return <Rank {...{children:[],cols,width,height,last}}/>
		const i=this.currentColumn.length-1
		const slots=columns.map(column=>column[i])
		const height=this.getHeight(slots)
		return (
			<Rank children={slots} cols={cols} width={width} height={height} last={last}/>
		)
	}

	getHeight(slots){
		return Math.max(this.props.height||0,...slots.filter(a=>!!a).map(a=>a.props.nonContentHeight+a.props.frame.blockOffset))
	}
}

class Rank extends Component{
	static displayName="rank"
	static adjustHeight(rendered){

	}

	render(){
		const {children:slots=[],cols,height,last, ...props}=this.props

		return (
				<Group height={height} {...props} >
				{
					slots.map((a,i)=>React.cloneElement(a,{
						...cols[i],
						height,
						key:i,
					}))
				}
				</Group>
			)
	}
}
function changeHeightUp(height, rank, parents, ) {
	const delta=height-rank.props.height
	if(delta==0)
		return parents[0]
	return parents.reduceRight((child, parent) => {
		const { props: { height, children } } = parent;
			if (React.Children.count(children) == 1) {
			if (typeof (height) == "number") {
				return React.cloneElement(parent, { height: height + delta }, child);
			}
		}
		else {
			throw new Error("row's offspring should only has one child");
		}
		return parent;
	}, React.cloneElement(rank, { height }));
}

