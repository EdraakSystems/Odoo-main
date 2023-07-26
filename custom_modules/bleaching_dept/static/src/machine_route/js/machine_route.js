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
            machineRouteTable: [],
            savedRouteId: null,
            selectedMachineRoute:[],
            formattedRoute:[],
            newFormattedRoute: "",
        });
        onWillStart(async () => {
            this.retrieveSelectedIdForRoute();
            this.state.machineTypes = await this.orm.searchRead("bleaching_machine.types", [], ["id", "machine_type_name"]);
            this.state.machines = await this.orm.searchRead("bleaching.machines", [], ["id", "machine_name", "machine_type", "underMaintenance"]);
            this.state.machineRouteTable = await this.orm.searchRead("machine.routing", [], ["id", "orderId", "route_name", "machineId", "delay", "status"]);

            console.log('machineRouteTable : ', this.state.machineRouteTable);

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
        this.add_delay = this.add_delay.bind(this);
    }
    retrieveSelectedIdForRoute() {
        const url = new URL(window.location.href);
        const selectedIdForRoute = url.searchParams.get("selectedIdForRoute");
        this.state.savedRouteId = parseInt(selectedIdForRoute);
        console.log('this.state.savedRouteId :', this.state.savedRouteId);
    }
    async onButtonClicked(ev) {
        const machineId = ev.currentTarget.dataset.machineId;
        console.log('machineId: ', machineId);
        const machine = this.state.machines.find(m => m.id === parseInt(machineId));
        console.log('machine: ', machine);

        if (machine && !machine.underMaintenance) {
            // Extract route_name values from machineRouteTable
            const routeNames = this.state.machineRouteTable.map(item => item.route_name);
            // Find the maximum route number
            const maxRouteNumber = routeNames.reduce((max, route) => {
                const routeNumber = parseInt(route.split('_')[1]);
                return isNaN(routeNumber) ? max : Math.max(max, routeNumber);
            }, 0);
            // Increment the maximum route number by 1 to get the new route number
            const newRouteNumber = maxRouteNumber + 1;
            // Create the new route_name
            const newRouteName = `route_${newRouteNumber}`;

            // Create a new row with the updated route_name
            const newRow = {
                route_name: newRouteName,
                machineId: machineId,
                orderId: this.state.savedRouteId,
                status: 'Pending',
                delay: 0,
            };
            // Assuming you have a method to create a new row in the database using the 'orm' service
            await this.orm.create("machine.routing", [newRow]); // Pass newRow inside an array

            this.state.selectedMachineRoute.push(newRow);
            console.log('this.state.selectedMachineRoute : ', this.state.selectedMachineRoute);

            console.log('this.state.newFormattedRoute : ', this.state.newFormattedRoute);

           const formattedMachineName = this.state.machines.find(m => m.id === parseInt(machineId))?.machine_name;
            if (formattedMachineName) {
                if (this.state.newFormattedRoute.length > 0) {
                    this.state.newFormattedRoute += ' --> ';
                }
                this.state.newFormattedRoute += formattedMachineName;
            }

            console.log('this.state.newFormattedRoute : ', this.state.newFormattedRoute);

            // Update the state to reflect the changes
            this.state.selectedRoute.push(machine.machine_name);
            this.state.selectedRouteIds.push(machineId);
            this.render();
        }
    }

    generateRandomNumber() {
        const randomNum = Math.floor(Math.random() * 10000000);
        return randomNum;
    }

    async add_delay() {
        const orderIds = this.state.machineRouteTable.map(item => item.orderId);
        const lastIndex = orderIds.length - 1;
        const lastOrderId = orderIds[lastIndex];

        const delayInput = document.getElementById('delayInput');
        if (delayInput) {
            const delayValue = delayInput.value;

            const tableValue = await this.orm.searchRead("machine.routing", [], ["id", "orderId", "route_name", "machineId", "delay", "status"]);

            // Find the last row in the tableValue array
            const lastRow = tableValue[tableValue.length - 1];
            const lastRowOrderId = lastRow.orderId;

            // Check if lastOrderId and lastRowOrderId are the same
            if (lastOrderId === lastRowOrderId) {
                this.state.notification.add("Select a Machine First", {
                    title: "Warning",
                    type: "warning",
                });

                console.log("Can't add delay. Last Order ID already exists in the table.");
                return; // Exit the function without writing to the table
            }
            const lastRowId = parseInt(lastRow.id);

            // Check if the last index is valid in 'selectedMachineRoute' array
            if (lastIndex >= 0 && lastIndex < this.state.selectedMachineRoute.length) {
                // Update the 'delay' value in the last object of 'selectedMachineRoute'
                this.state.selectedMachineRoute[lastIndex].delay = delayValue;
            } else {
                // Push a new object with the updated 'delay' value
                this.state.selectedMachineRoute.push({
                    route_name: lastRow.route_name,
                    machineId: lastRow.machineId,
                    orderId: lastRow.orderId,
                    status: lastRow.status,
                    delay: delayValue,
                });
            }

             // Add the delay value to the newFormattedRoute
            this.state.newFormattedRoute += ` --> (${delayValue}-Delay)`;

            await this.orm.write("machine.routing", [lastRowId], { delay: delayValue }); // Pass the ID as a list
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