import React, {Component, PureComponent} from "react"
import PropTypes from "prop-types"
import {withContext} from "recompose"

import {Representation} from "we-edit"

import * as variants from "./all"

export function withVariant(Components){
	let Variants=Object.keys(variants).reduce((transformed,k)=>{
			transformed[k]=variants[k](Components)
			return transformed
		},{})
	return {...Components,...Variants}
}


export class VariantRepresentation extends Component{
	static childContextTypes={
		variantContext: PropTypes.object
	}

	getChildContext(){
		return {
			variantContext:this.props.variants
		}
	}

	render(){
		const {variants, transformer=a=>a, ...props}=this.props
		return (<Representation {...props} transformer={a=> a && transformer(withVariant(a))}/>)
	}
}
