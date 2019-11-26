import React from "react"
import PropTypes from "prop-types"
import {dom} from "we-edit"

import Frame from "./frame"
import memoize from "memoize-one"

const factory=MyFrame=>class __$1 extends MyFrame{
	static displayName=MyFrame.displayName.replace("-frame","-"+dom.Page.displayName)

	static factory=factory

	static propTypes=dom.Page.propTypes||{}
	static defaultProps=dom.Page.defaultProps||{}

	defineProperties(){
		super.defineProperties()
		Object.defineProperties(this,{
			cols:{
				enumerable:false,
				configurable:true,
				get(){
					const {
						width,
						height,
						margin:{left=0,right=0,top=0,bottom=0}={},
						cols=[{x:left,y:top,width:width-left-right,height:height-top-bottom}]
					}=this.props
					return cols
				}
			},
		})
	}

	createComposed2Parent=memoize(()=>{
		const render=()=>{
			const {props:{I:key,width,height,margin}}=this
			return React.cloneElement(super.createComposed2Parent(),{key,width,height,margin,I:key})
		}

		return new Proxy(this,{
			get(target, key){
				if(key=="render")
					return render
				return target[key]
			}
		})
	})
}

export default factory(Frame)
