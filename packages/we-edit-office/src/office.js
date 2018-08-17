import React, {Fragment} from "react"
import {WeEdit, Viewer, Editor, Emitter,Stream, Representation} from "we-edit"
import {compose,setDisplayName,setStatic, withProps}  from "recompose"

import WeEditUI from "./we-edit-ui"
import Workspace from "./workspace"
import Ribbon, {Tab} from "./ribbon"

import IconRead from "material-ui/svg-icons/communication/import-contacts"
import IconPrint from "material-ui/svg-icons/editor/format-align-justify"

const Default={
	workspaces:[
		<Workspace 
			accept="*.*"
			key="*"
			layout="print"
			toolBar={<Ribbon commands={{layout:false}}/>}
			>
			<Viewer
				toolBar={null} 
				ruler={false}
				layout="read" 
				icon={<IconRead/>}
				representation={<Representation type="pagination"/>}
				/>
			<Editor
				layout="print" 
				icon={<IconPrint/>}
				representation={<Representation type="pagination"/>}
				/>
		</Workspace>
	]
}

var myOffice=[Default]

export default compose(
		setDisplayName("Office"),
		setStatic("install", function install(office1){
			myOffice.push(office1)
		}),
		
		setStatic("uninstall", function uninstall(office1){
			myOffice.splice(myOffice.indexOf(office1),1)
		}),
		withProps(props=>{
			let _=myOffice.reduce((merged,a)=>({
				...merged, 
				...a, 
				workspaces:[...(a.workspaces||[]), ...merged.workspaces]
			}),{workspaces:[]})
			let {titleBar=_.titleBar, dashboard=_.dashboard, workspaces=_.workspaces}=props
			return {
				titleBar,
				dashboard,
				workspaces
			}
		})
	)(({
        titleBarProps,
        fonts=["Arial", "Calibri", "Cambria"],
		children,
		titleBar,
		dashboard,
		workspaces
    })=>{
		
		return (
			<WeEdit>
				<WeEditUI {...{titleBarProps, fonts, titleBar,dashboard}}>
					{workspaces}
					{children}
				</WeEditUI>
			</WeEdit>
		)
	})

