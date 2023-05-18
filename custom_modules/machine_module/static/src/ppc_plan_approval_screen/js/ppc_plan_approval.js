/**     @odoo-module **/
import { registry } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";

export class PpcPlanApproval extends Component{
    setup(){
        this.state = useState({
            ppcPlansList:[],
            fabricTypeArrays: [],
            selectedMachines: [],
        });
        this.orm = useService("orm");
        onWillStart(async()=>{
            this.state.ppcPlansList = await this.orm.searchRead("machine.data", [], ["id" , "machineName", "ppLotNum", "planApprove", "greyMeter", "jobCard", "shade", "quality", "fabricType", "contract"]);
            const fabricTypes = new Set(this.state.ppcPlansList.map(plan => plan.fabricType));
            const fabricTypeArrays = [];
            for (const fabricType of fabricTypes) {
                if (fabricType === false) {
                    continue;
                }
                const fabricTypeData = this.state.ppcPlansList.filter(plan => plan.fabricType === fabricType);
                const fabricTypeObject = {
                    type: fabricType,
                    data: fabricTypeData,
                };
                fabricTypeArrays.push(fabricTypeObject);
            }
            console.log(fabricTypeArrays);
            this.state.fabricTypeArrays = fabricTypeArrays;
        });
        this.onChangeCheckbox = this.onChangeCheckbox.bind(this);
    }
async onChangeCheckbox(ev) {
    const machineId = parseInt(ev.currentTarget.dataset.machineId, 10);
    const checked = ev.currentTarget.checked;
    const machine = this.state.ppcPlansList.find(machine => machine.id === machineId);
    if (machine) {
        machine.planApprove = checked;
        await this.orm.write("machine.data", [machine.id], {planApprove: checked});
    }
}
}
PpcPlanApproval.template = 'machine_module.ppcPlanApproval';
registry.category('actions').add('machine_module.ppc_plan_approval_js', PpcPlanApproval);

