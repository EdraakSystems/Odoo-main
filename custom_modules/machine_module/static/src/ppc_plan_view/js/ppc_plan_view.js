/** @odoo-module **/
import { registry } from '@web/core/registry';
const { Component, useState, onWillStart, computed } = owl;
import { useService } from "@web/core/utils/hooks";

export class PpcPlanView extends Component {
  setup() {
    this.state = useState({
      approvedPlanList: [],
      executionApprovedList: [],
      reprocessList: [],
      internalApprovedList: [],
      machineDataList: [],
    });
    this.orm = useService("orm");
    onWillStart(async () => {
      await this.fetchData(); // Fetch initial data
    });
    this.checkboxAction = this.checkboxAction.bind(this);
    this.redirectToMachineStatusScreen = this.redirectToMachineStatusScreen.bind(this);
    this.redirectToInternalPlanScreen = this.redirectToInternalPlanScreen.bind(this);
    this.redirectToDepartmentScreen = this.redirectToDepartmentScreen.bind(this);
    this.redirectToSetRouteScreen = this.redirectToSetRouteScreen.bind(this);
    this.checkboxActionOnReprocess = this.checkboxActionOnReprocess.bind(this);
    this.redirectToSetParamsScreen = this.redirectToSetParamsScreen.bind(this);




//    this.generateRandomNumber = this.generateRandomNumber.bind(this);

  }



  async fetchData() {
    this.state.approvedPlanList = await this.orm.searchRead(
      "machine.data",
      [["planApprove", "=", true],  ["reprocess", "=", false] ],
      ["id", "machineName", "ppLotNum", "shade", "contract", "planApprove", "jobCard", "executionApproval", "reprocess"]
    );

    let machinesData = await this.orm.searchRead(
      "machine.details", [], ["id", "subMachines"]
    );

    this.state.machineDataList=machinesData;

    this.state.executionApprovedList = await this.orm.searchRead(
      "machine.data",
      [["executionApproval", "=", true], ["planApprove", "=", true]],
      ["id", "machineName", "ppLotNum", "shade", "contract", "planApprove", "jobCard", "executionApproval"]
    );

    this.state.reprocessList = await this.orm.searchRead(
      "machine.data",
      [["reprocess", "=", true]],
      ["id", "machineName", "ppLotNum", "shade", "contract", "planApprove", "jobCard", "executionApproval", "reprocess"]
    );

    await this.reloadInternalApprovedPlan();
  }

//generateRandomNumber() {
//    const randomNum = Math.floor(Math.random() * 10000);
//    console.log("Random: ", randomNum);
//    return randomNum;
//}


  async checkboxAction(ev) {
  console.log("REPROCESS", ev);
    const planId = parseInt(ev.currentTarget.dataset.planId, 10);
    const checked = ev.currentTarget.checked;
    const machine = this.state.approvedPlanList.find((machine) => machine.id === planId);
    if (machine) {
      const updatedFields = { executionApproval: checked };
      await this.orm.write("machine.data", [machine.id], updatedFields);
      machine.executionApproval = checked;
      await this.reloadInternalApprovedPlan();
      this.render();
    }
  }

async checkboxActionOnReprocess(ev) {
  console.log("REPROCESS", ev);
  const reprocessId = parseInt(ev.currentTarget.dataset.reprocessId, 10);
  const checked = ev.currentTarget.checked;
  const reprocess = this.state.reprocessList.find((item) => item.id === reprocessId);
  if (reprocess) {
    const updatedFields = { executionApproval: checked };
    try {
      console.log("RUNNING");
      await this.orm.write("machine.data", [reprocess.id], updatedFields);
      reprocess.executionApproval = checked;
      await this.reloadInternalApprovedPlan();
      this.render();
    } catch (error) {
      console.error("Error occurred during write operation:", error);
    }
  }
}




    async reloadInternalApprovedPlan() {
      let data = await this.orm.searchRead(
        "machine.data",
        [["executionApproval", "=", true]],
        ["id", "machineName", "ppLotNum", "shade", "contract", "planApprove", "jobCard", "executionApproval", "machineRoute"]
      );

      let machinesData = this.state.machineDataList;
      data = data.map((item)=>{
        return ({
                ...item,
                machineRoute : item?.machineRoute!="" ?item.machineRoute?.split(",").map((route,index)=>({index,...machinesData.filter((machine)=>+machine.id==+route)[0]})) :[]
        })
      })
      console.log({data})
      this.state.internalApprovedList=data;
      console.log("STATE",this.state.internalApprovedList)
      this.render();
    }

  redirectToMachineStatusScreen() {
    window.location.href = "/web#action=machine_module.machine_status_screen_js";
  }

  redirectToInternalPlanScreen() {
    window.location.href = "/web#action=machine_module.ppc_plan_approval_js";
  }

  redirectToDepartmentScreen() {
    window.location.href = "/web#action=machine_module.department_status_screen_js";
  }

  redirectToSetRouteScreen(ev) {
    const selectedIdForRoute = ev.target.getAttribute('data-machine-id');
    console.log("Selected Id from Sending Page: ", selectedIdForRoute)
    const url = new URL("/web#action=machine_module.machine_route_screen_js", window.location.origin);
    url.searchParams.set("selectedIdForRoute", selectedIdForRoute);
    window.location.href = url.toString();
  }

    redirectToSetParamsScreen(ev) {
    const selectedIdForRoute = ev.target.getAttribute('data-machine-id');
    console.log("Selected Id from Sending Page: ", selectedIdForRoute)
    const url = new URL("/web#action=machine_module.machine_params_screen_js", window.location.origin);
    url.searchParams.set("selectedIdForRoute", selectedIdForRoute);
    window.location.href = url.toString();
  }

}
PpcPlanView.template = "machine_module.ppcPlanView";
registry.category("actions").add("machine_module.ppc_plan_view_js", PpcPlanView);

