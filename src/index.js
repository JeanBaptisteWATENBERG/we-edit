import React, {Component, PropTypes} from "react"
import ReactDOM from "react-dom"

if (!String.prototype.splice) {
    String.prototype.splice = function(start, delCount, newSubStr) {
        return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
    };
}

export default function edit(){

}

import Content from "./content"
import Editor from "./editor"


import SVGWordWrapper from "./wordwrap/svg"
import CanvasWordWrapper from "./wordwrap/canvas"

import {loadFont} from "./wordwrap/fonts"

//Text.WordWrapper=CanvasWordWrapper

let A=Editor
export function test(){
    loadFont()

    ReactDOM.render((
        <A.Document>
            <A.Section>
                <A.Paragraph>
                    <A.Inline><A.Text>{Array(100).fill("hello1, let's edit").join(" ")}</A.Text></A.Inline>
                    <A.Image width={100} height={100}
                        src="http://n.sinaimg.cn/news/transform/20160629/gbf3-fxtniax8255947.jpg"/>

                    <A.Inline><A.Text>{Array(1).fill("over").join(" ")}</A.Text></A.Inline>
                </A.Paragraph>
            </A.Section>
        </A.Document>
    ),document.querySelector('#app'))
}
