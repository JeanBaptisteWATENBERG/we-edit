import React,{Fragment, Component} from "react"
import {models} from "we-edit"
import {HasParentAndChild} from "we-edit-representation-pagination/composable"
import recomposable from "we-edit-representation-pagination/edit/recomposable"

import {Editors} from "we-edit-representation-html"
import Document from "./document"
import Paragraph from "./paragraph"
import Text from "./text"

const wrapper=A=>recomposable(HasParentAndChild(A))

export default Object.keys(Editors)
	.reduce((TextEditors, k)=>{
		if(!TextEditors[k]){
			TextEditors[k]=wrapper(Editors[k])
		}
		return TextEditors
	},{
		Document,
		Section:Editors.Section,
		Paragraph,
		Text
	})
