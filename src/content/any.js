import React, {Component, PropTypes} from "react"
import Group from "../compose/group"
import shallowCompare from 'react-addons-shallow-compare'

export class HasChild extends Component{
    static childContextTypes={
        parent: PropTypes.object.isRequired,
        composedTime: PropTypes.string.isRequired
    }

    state={}
	children=[]
    composed=[]

    getChildContext(){
        return {
            parent:this,
            composedTime: this.state.composedTime || this.context.composedTime
        }
    }

	render(){
        return <Group {...this.props}/>
    }

    componentWillMount(){
        this.compose()
    }

	compose(){

    }

    /**
     * children should call before composing line,
     * return next line rect {*width, [height]}
     */
    nextAvailableSpace(required={width:0, height:0}){

    }

	/**
     * children should call after a line composed out
     * a chance to add to self's composed
     */
    appendComposed(line){

    }

	/**
	 *  child calls context.parent.finished() to notify parent finished composed itself
	 *  return
	 *  	true: parent's children all composed, usually to notify parent's parent
	 */
    finished(child){
		this.children.push(child)
		return React.Children.count(this.props.children)==this.children.length
    }
}

var uuid=0
export default class HasParent extends HasChild{
    static contextTypes={
        parent: PropTypes.object,
        composedTime: PropTypes.string
    }

	_id=uuid++
    /**
     * children should call before composing line,
     * return next line rect {*width, [height]}
     */
    nextAvailableSpace(){
        return this.context.parent.nextAvailableSpace(...arguments)
    }

    /**
     * children should call after a line composed out
     * a chance to add to self's composed
     */
    appendComposed(){
        return this.context.parent.appendComposed(...arguments)
    }

	/**
	 *  it's a very complicated job, so we need a very simple design, one sentence described solution. options:
	 *  1. remove all composed, and re-compose all
	 *  	- need find a time to recompose
	 *  	- logic is most simple
	 *  	- performance is most bad
	 *
	 *  2. remove all composed from this content, and re-compose removals
	 *  	- Need locate composed of this content in page
	 *  	- Need find a time to recompose
	 *  		> componentDidUpdate
	 *  			. any state update,
	 *  			. and carefully tuned shouldComponentUpdate(nextProps, nextState, nextContext)
	 *  	- performance is better than #1
	 *
	 *  3. recompose this content, and check if new composed fits last composed space (hit ratio is low)
	 *  	- Yes: just replace
	 *  	- No: #1, or #2
	 *  	- and then loop with all following content with the same logic
	 *
	 *  	3.a: recompose this content line by line ..., much logics here
	 */
	reCompose(){
		this.composed[0] && this._reComposeFrom(this.composed[0])//#2 solution
	}

	_reComposeFrom(reference){//#2
		this.composed.splice(0)
		this.children.splice(0)
		this._removeAllFrom(...arguments)
	}

	_removeAllFrom(reference){
        console.log(`remove all from ${this.displayName} ${reference ? "" : "not"} including child, and parent`)
		if(reference)
			this.children.forEach(a=>a._removeAllFrom())

		this.composed.splice(0)
		this.children.splice(0)

		if(reference)
			this.context.parent._removeAllFrom(this)
	}
    /**
     * only no composed should be re-compose
     */
    shouldComponentUpdate(nextProps, nextState, nextContext){
        console.log(`shouldComponentUpdate on ${this.displayName}, with ${this.composed.length==0}`)
        if(this.composed.length==0){
            //this.compose()
            return true
        }
        return false
    }

    componentDidUpdate(){
        this.compose()
    }

    componentWillReceiveProps(){
        console.log(`componentWillReceiveProps on ${this.displayName}`)

    }


	finished(child){
		if(super.finished(child)){
			this.context.parent.finished(this)
			return true
		}
		return false
	}
}
