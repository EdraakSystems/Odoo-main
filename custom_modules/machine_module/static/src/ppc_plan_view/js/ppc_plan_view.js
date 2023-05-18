///** @odoo-module **/
//import { registry } from '@web/core/registry';
//const { Component, useState, onWillStart } = owl;
//import { useService } from "@web/core/utils/hooks";
//
//export class PpcPlanView extends Component {
//  setup() {
//    this.state = useState({
//      approvedPlanList: [],
//      executionApprovedList: [],
//      reprocessList: [],
//      internalApprovedList: [],
//      machineRoute: [],
//    });
//    this.orm = useService("orm");
//    onWillStart(async () => {
//      await this.fetchData(); // Fetch initial data
//    });
//    this.checkboxAction = this.checkboxAction.bind(this);
//    this.redirectToMachineStatusScreen = this.redirectToMachineStatusScreen.bind(this);
//    this.redirectToInternalPlanScreen = this.redirectToInternalPlanScreen.bind(this);
//    this.redirectToDepartmentScreen = this.redirectToDepartmentScreen.bind(this);
//    this.redirectToSetRouteScreen = this.redirectToSetRouteScreen.bind(this);
//  }
//
//  async fetchData() {
//    this.state.approvedPlanList = await this.orm.searchRead(
//      "machine.data",
//      [["planApprove", "=", true]],
//      ["id", "machineName", "ppLotNum", "shade", "contract", "planApprove", "jobCard", "executionApproval"]
//    );
//
//    this.state.executionApprovedList = await this.orm.searchRead(
//      "machine.data",
//      [["executionApproval", "=", true], ["planApprove", "=", true]],
//      ["id", "machineName", "ppLotNum", "shade", "contract", "planApprove", "jobCard", "executionApproval"]
//    );
//
//    this.state.reprocessList = await this.orm.searchRead(
//      "machine.data",
//      [["reprocess", "=", true]],
//      ["id", "machineName", "ppLotNum", "shade", "contract", "planApprove", "jobCard", "executionApproval", "reprocess"]
//    );
//
//    await this.reloadInternalApprovedPlan();
//  }
//
//  async checkboxAction(ev) {
//    const planId = parseInt(ev.currentTarget.dataset.planId, 10);
//    const checked = ev.currentTarget.checked;
//    const machine = this.state.approvedPlanList.find((machine) => machine.id === planId);
//    if (machine) {
//      const updatedFields = { executionApproval: checked };
//      await this.orm.write("machine.data", [machine.id], updatedFields);
//      machine.executionApproval = checked;
//      await this.reloadInternalApprovedPlan();
//      this.render();
//    }
//  }
//
//  async reloadInternalApprovedPlan() {
//    this.state.internalApprovedList = await this.orm.searchRead(
//      "machine.data",
//      [["executionApproval", "=", true]],
//      ["id", "machineName", "ppLotNum", "shade", "contract", "planApprove", "jobCard", "executionApproval"]
//    );
//    this.render();
//  }
//
//  // Button
//  redirectToMachineStatusScreen() {
//    window.location.href = "/web#action=machine_module.machine_status_screen_js";
//  }
//
//  redirectToInternalPlanScreen() {
//    window.location.href = "/web#action=machine_module.ppc_plan_approval_js";
//  }
//
//  redirectToDepartmentScreen() {
//    window.location.href = "/web#action=machine_module.department_status_screen_js";
//  }
//
//  redirectToSetRouteScreen(ev) {
//    const selectedIdForRoute = ev.target.getAttribute('data-machine-id');
//    console.log("Button Clicked, ID:", selectedIdForRoute);
//    window.location.href = "/web#action=machine_module.machine_route_screen_js";
//  }
//}
//
//PpcPlanView.template = "machine_module.ppcPlanView";
//registry.category("actions").add("machine_module.ppc_plan_view_js", PpcPlanView);





/** @odoo-module **/
import { registry } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";

export class PpcPlanView extends Component {
  setup() {
    this.state = useState({
      approvedPlanList: [],
      executionApprovedList: [],
      reprocessList: [],
      internalApprovedList: [],
      machineRoute: [],
    });
    this.orm = useService("orm");
    onWillStart(async () => {
      await this.fetchData(); // Fetch initial data
//      this.retrieveSelectedIdForRoute();
    });
    this.checkboxAction = this.checkboxAction.bind(this);
    this.redirectToMachineStatusScreen = this.redirectToMachineStatusScreen.bind(this);
    this.redirectToInternalPlanScreen = this.redirectToInternalPlanScreen.bind(this);
    this.redirectToDepartmentScreen = this.redirectToDepartmentScreen.bind(this);
    this.redirectToSetRouteScreen = this.redirectToSetRouteScreen.bind(this);
  }

  async fetchData() {
    this.state.approvedPlanList = await this.orm.searchRead(
      "machine.data",
      [["planApprove", "=", true]],
      ["id", "machineName", "ppLotNum", "shade", "contract", "planApprove", "jobCard", "executionApproval"]
    );

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

    async checkboxAction(ev) {
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

  async reloadInternalApprovedPlan() {
    this.state.internalApprovedList = await this.orm.searchRead(
      "machine.data",
      [["executionApproval", "=", true]],
      ["id", "machineName", "ppLotNum", "shade", "contract", "planApprove", "jobCard", "executionApproval"]
    );
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
}

PpcPlanView.template = "machine_module.ppcPlanView";
registry.category("actions").add("machine_module.ppc_plan_view_js", PpcPlanView);
