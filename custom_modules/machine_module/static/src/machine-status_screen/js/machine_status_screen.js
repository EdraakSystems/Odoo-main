/** @odoo-module **/
import { registry } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";

export class MachineStatus extends Component{
    setup(){
        this.state = useState({
            machineList:[],
//            selectedMachine:null,
        });
        this.orm = useService("orm");
        onWillStart(async()=>{
            this.state.machineList = await this.orm.searchRead("machine.data", [], ["id" , "machineName", "ppLotNum"]);
        });
//        this.onClickButton = this.onClickButton.bind(this);
    }
//    onClickButton(event) {
//        console.log("Button clicked!",event.target.dataset);
//    }
}


MachineStatus.template = 'machine_module.Machines';
registry.category('actions').add('machine_module.machine_status_screen_js', MachineStatus);
