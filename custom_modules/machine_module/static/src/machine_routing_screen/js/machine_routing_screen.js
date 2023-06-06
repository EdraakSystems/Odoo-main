/** @odoo-module **/
import { registry } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";
import core from 'web.core';


export class MachineRoute extends Component {
    setup() {
        this.state = useState({
            nameOfAllMachines: [],
            machineTypeArrays: [],
            selectedRoute: [],
            selectedRouteIds: [],
            savedRouteId: null,
        });
        this.orm = useService("orm");
        onWillStart(async () => {
            this.state.nameOfAllMachines = await this.orm.searchRead("machine.details", [], ["id", "subMachines", "nameOfMachines", "underMaintenance"]);
            const machineTypes = new Set(this.state.nameOfAllMachines.map(plan => plan.nameOfMachines));
            const machineTypeArrays = [];
            for (const nameOfMachines of machineTypes) {
                if (nameOfMachines === false) {
                    continue;
                }
                const machineTypeData = this.state.nameOfAllMachines.filter(plan => plan.nameOfMachines === nameOfMachines);
                const machineTypeObject = {
                    type: nameOfMachines,
                    data: machineTypeData,
                };
                machineTypeArrays.push(machineTypeObject);
            }
            this.state.machineTypeArrays = machineTypeArrays;
            this.retrieveSelectedIdForRoute();
        });
        this.onButtonClicked = this.onButtonClicked.bind(this);
        this.retrieveSelectedIdForRoute = this.retrieveSelectedIdForRoute.bind(this); // Bind the method
        this.saveRoute = this.saveRoute.bind(this); // Bind the method
        this.generateRandomNumber = this.generateRandomNumber.bind(this); // Bind the method
        this.removeRoute = this.removeRoute.bind(this); // Bind the method
        this.state.notification =useService("notification");

    }
    async onButtonClicked(ev) {
        const machineId = ev.currentTarget.dataset.machineId;
        const machine = this.state.nameOfAllMachines.find(m => m.id === parseInt(machineId));
        if (machine && !machine.underMaintenance) {
            this.state.selectedRoute.push(machine.subMachines);
            this.state.selectedRouteIds.push(machineId);
            this.render();
        }
    }
    machineUnderMaintenance(machine) {
        return machine.underMaintenance ? "machine_under_maintenance" : "";
    }
retrieveSelectedIdForRoute() {
  const url = new URL(window.location.href);
  const selectedIdForRoute = url.searchParams.get("selectedIdForRoute");
  this.state.savedRouteId = parseInt(selectedIdForRoute);
}
generateRandomNumber() {
    const randomNum = Math.floor(Math.random() * 1000000);
    return randomNum;
}

removeRoute(event) {
const index = event.target.getAttribute("route");
console.log('CLicked', index);
this.state.selectedRoute.splice(index, 1);
}

saveRoute() {
  const routeId = this.state.savedRouteId;
  const selectedRouteIdsString = this.state.selectedRouteIds.join(", ");
  if (routeId) {
    this.orm.write("machine.data", [routeId], { machineRoute: selectedRouteIdsString })
      .then(() => {
        console.log("Successfully saved the selectedRouteIdsString to the database.");
        this.state.notification.add("Data Successfully Saved",{
        title: "Success",
        type: "success",
        });
        setTimeout(() => {
          window.location.href = "/web#action=machine_module.ppc_plan_view_js";
        }, 1500);
      })
      .catch((error) => {
        console.error("Error saving the selectedRouteIdsString to the database:", error);
        this.state.notification.add("Failed to Save Data", {
        title: "Warning",
        type: "warning",
      });
      });
  } else {
    console.error("No savedRouteId available.");
    this.state.notification.add("Failed to Save Data", {
        title: "Warning",
        type: "warning",
      });
  }
}
}
MachineRoute.template = 'machine_module.MachineRoute';
registry.category('actions').add('machine_module.machine_route_screen_js', MachineRoute);
