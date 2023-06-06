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
            this.state.ppcPlansList = await this.orm.searchRead("machine.data", [["reprocess", "=", false]], ["id", "machineName", "ppLotNum", "planApprove", "greyMeter", "jobCard", "shade", "quality", "fabricType", "contract", "dispatch_date", "red_alert", "niceone", "ggs", "simms", "kks", "giki", "puurppl" , "odoo6", "goonzquad"]);
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
            this.state.fabricTypeArrays = fabricTypeArrays;
        });
        this.onChangeCheckbox = this.onChangeCheckbox.bind(this);
        this.redirectToRoutingScreen = this.redirectToRoutingScreen.bind(this);
        this.state.notification =useService("notification");
    }
async onChangeCheckbox(ev) {
  console.log("console list: ", this.state.ppcPlansList);
  const machineId = parseInt(ev.currentTarget.dataset.machineId, 10);
  const checked = ev.currentTarget.checked;
  const machine = this.state.ppcPlansList.find(machine => machine.id === machineId);
  if (machine) {
    machine.planApprove = checked;
    try {
      await this.orm.write("machine.data", [machine.id], { planApprove: checked });
      this.state.notification.add("Data Successfully Saved", {
        title: "Success",
        type: "success",
      });
    } catch (error) {
      console.error("Error saving data:", error);
      this.state.notification.add("Failed to Save Data", {
        title: "Warning",
        type: "warning",
      });
    }
  }
}



redirectToRoutingScreen() {
    window.location.href = "/web#action=machine_module.ppc_plan_view_js";
}
}
PpcPlanApproval.template = 'machine_module.ppcPlanApproval';
registry.category('actions').add('machine_module.ppc_plan_approval_js', PpcPlanApproval);
