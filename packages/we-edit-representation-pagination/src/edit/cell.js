import {Cacheable} from "../composable"
import editable from "./editable"
import Base from "../cell"

export default class extends editable(Base){
    appendLastComposed(){
        this.computed.lastComposed=[]
        this.appendComposed(this.frame)
    }
}
