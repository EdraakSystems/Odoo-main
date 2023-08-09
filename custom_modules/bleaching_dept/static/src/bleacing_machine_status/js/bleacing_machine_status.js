/** @odoo-module **/
import {registry, bus, services } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";
import { hooks } from '@odoo/owl';
import { useModel } from '@odoo/owl';

export class MachineStatus extends Component {
    setup() {
        this.orm = useService("orm");
        this.state = useState({
            machines:[],
            machineRouting:[],
            machineStatus:[],
        });
        onWillStart(async () => {
            await this.getData();

            console.log('this.state.machines : ', this.state.machines);
            console.log('this.state.machineRouting : ', this.state.machineRouting);
            console.log('this.state.machineStatus : ', this.state.machineStatus);
        });
        this.state.notification =useService("notification");
        this.getData = this.getData.bind(this);
        this.organizeMachinesByType = this.organizeMachinesByType.bind(this);
    }

    async timeSelector(event) {
        const selectedValue = event.target.value;
        const date = await this.orm.searchRead("machine.routing", [], ["id", "orderId", "create_date", "write_date", "machineId"]);
        const today = new Date();

        for (const entry of date) {
            const writeDate = new Date(entry.write_date);
            const timeDifference = today - writeDate; // Difference in milliseconds
            const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // Convert milliseconds to hours
            console.log(`ID: ${entry.id}, Days Difference: ${hoursDifference}`);
        }
    }

    async getData(){
        this.state.machines = await this.orm.searchRead("bleaching.machines", [], ["id", "machine_name", "machine_type", "underMaintenance"]);
        this.state.machineRouting = await this.orm.searchRead("machine.routing", [], ["id", "orderId", "machineId", "status"]);
        const machinesByType = this.organizeMachinesByType();
        this.state.machineStatus = machinesByType;
    }

    organizeMachinesByType() {
        const machinesByType = {};
        this.state.machines.forEach(machine => {
            const machineType = machine.machine_type[1]; // Get the machine_type name from the array (2nd index)
            const machineTypeId = machine.machine_type[0]; // Get the machine_type_id from the array (1st index)
            const machineId = machine.id;
            const machineName = machine.machine_name;
            const machineMaintenance = machine.underMaintenance;

            if (!machinesByType[machineType]) {
                machinesByType[machineType] = [{
                    machine_type_id: machineTypeId,
                    machine_type_name: machineType,
                    machine_id: machineId,
                    machine_name: machineName,
                    machine_under_maintenance: machineMaintenance,
                    wip: this.getWIPData(machineId)
                }];
            } else {
                machinesByType[machineType].push({
                    machine_type_id: machineTypeId,
                    machine_type_name: machineType,
                    machine_id: machineId,
                    machine_name: machineName,
                    machine_under_maintenance: machineMaintenance,
                    wip: this.getWIPData(machineId)
                });
            }
        });
        // Convert machinesByType from object to array
        const machinesArray = Object.values(machinesByType);
        return machinesArray;
    }

    getWIPData(machineId) {
        const wipData = {};
        this.state.machineRouting.forEach(machineRoute => {
            if (machineRoute.machineId === machineId) {
                const status = machineRoute.status;
                if (!wipData[status]) {
                    wipData[status] = [machineRoute.orderId];
                } else {
                    wipData[status].push(machineRoute.orderId);
                }
            }
        });
        return wipData;
    }

    generateRandomNumber() {
        const randomNum = Math.floor(Math.random() * 10000000);
        return randomNum;
    }
}
MachineStatus.template = 'bleaching_dept.MachineStatusTemplate';
registry.category('actions').add('bleaching_dept.machine_status_js', MachineStatus);
