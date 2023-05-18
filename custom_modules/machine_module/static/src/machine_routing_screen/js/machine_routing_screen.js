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
            console.log(machineTypeArrays);
            this.state.machineTypeArrays = machineTypeArrays;
            this.retrieveSelectedIdForRoute();
        });
        this.onButtonClicked = this.onButtonClicked.bind(this);
        this.retrieveSelectedIdForRoute = this.retrieveSelectedIdForRoute.bind(this); // Bind the method
    }
    async onButtonClicked(ev) {
        const machineId = ev.currentTarget.dataset.machineId;
        const machine = this.state.nameOfAllMachines.find(m => m.id === parseInt(machineId));
        if (machine && !machine.underMaintenance) {
            this.state.selectedRoute.push(machine.subMachines);
            this.render();
            console.log("ID: ", machineId)
        }
        console.log("Route: ",this.state.selectedRoute)
    }
    machineUnderMaintenance(machine) {
        return machine.underMaintenance ? "machine_under_maintenance" : "";
    }


    retrieveSelectedIdForRoute() {
        const url = new URL(window.location.href);
        const selectedIdForRoute = url.searchParams.get("selectedIdForRoute");
        console.log("Retrieved Selected ID for Route :", selectedIdForRoute);
    }

}
MachineRoute.template = 'machine_module.MachineRoute';
registry.category('actions').add('machine_module.machine_route_screen_js', MachineRoute);
