/** @odoo-module **/
import {registry, bus, services } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";
import { hooks } from '@odoo/owl';
import { useModel } from '@odoo/owl';

export class MachineRoute extends Component {
    setup() {
        this.orm = useService("orm");
        this.state = useState({
            machines:[],
            machineTypes:[],
            selectedRoute: [],
            selectedRouteIds:[],
            savedRouteId: null,
        });
        onWillStart(async () => {
            this.retrieveSelectedIdForRoute();
            this.state.machineTypes = await this.orm.searchRead("bleaching_machine.types", [], ["id", "machine_type_name"]);
            this.state.machines = await this.orm.searchRead("bleaching.machines", [], ["id", "machine_name", "machine_type", "underMaintenance"]);

            const machineTypeNames = this.state.machines.map(machineType => {
                return { ...machineType, machine_type: machineType.machine_type[1] };
            });
            this.state.machines = machineTypeNames;

            // Add the 'data' property to each object in 'this.state.machineTypes'
            this.state.machineTypes = this.state.machineTypes.map(machineType => ({
                ...machineType,
                data: [],
            }));

            // Populate the 'data' property with IDs of matching machines
            this.state.machineTypes.forEach(machineType => {
                const machineTypeName = machineType.machine_type_name;
                this.state.machines.forEach(machine => {
                    const machineTypeFromMachines = machine.machine_type;
                    if (machineTypeFromMachines === machineTypeName) {
                        machineType.data.push({ id: machine.id, machine_name: machine.machine_name, underMaintenance : machine.underMaintenance});
                    }
                });
            });

            console.log('this.state.machines: ', this.state.machines);
            console.log('this.state.machineTypes: ', this.state.machineTypes);
        });
        this.state.notification =useService("notification");
        this.retrieveSelectedIdForRoute = this.retrieveSelectedIdForRoute.bind(this);
        this.onButtonClicked = this.onButtonClicked.bind(this);
    }

    retrieveSelectedIdForRoute() {
        const url = new URL(window.location.href);
        const selectedIdForRoute = url.searchParams.get("selectedIdForRoute");
        this.state.savedRouteId = parseInt(selectedIdForRoute);
        console.log('this.state.savedRouteId :', this.state.savedRouteId);
    }
    generateRandomNumber() {
        const randomNum = Math.floor(Math.random() * 100000000000);
        return randomNum;
    }
    async onButtonClicked(ev) {
        const machineId = ev.currentTarget.dataset.machineId;
        const machine = this.state.machines.find(m => m.id === parseInt(machineId));
        if (machine && !machine.underMaintenance) {
            this.state.selectedRoute.push(machine.machine_name);
            this.state.selectedRouteIds.push(machineId);
            this.render();
        }
    }

    saveRoute() {
      const routeId = this.state.savedRouteId;
      const selectedRouteIdsString = this.state.selectedRouteIds.join(", ");
      if (routeId) {
        this.orm.write("order.data", [routeId], { machineRoute: selectedRouteIdsString })
          .then(() => {
            console.log("Successfully saved the selectedRouteIdsString to the database.");
            this.state.notification.add("Data Successfully Saved",{
            title: "Success",
            type: "success",
            });
            setTimeout(() => {
              window.location.href = "/web#action=bleaching_dept.create_internal_plan_js";
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
MachineRoute.template = 'bleaching_dept.machineRouteTemplate';
registry.category('actions').add('bleaching_dept.machine_route_js', MachineRoute);