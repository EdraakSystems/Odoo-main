/** @odoo-module **/
import {registry, bus, services } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";
import { hooks } from '@odoo/owl';
import { useModel } from '@odoo/owl';

export class MachineParams extends Component {
    setup() {
        this.orm = useService("orm");
        this.state = useState({
            savedRouteId: null,
            selectedMachineRoute:[],
            machines:[],
            machineType:[],
            formattedRouteData:[],
        });
        onWillStart(async () => {
            await this.retrieveSelectedIdForRoute(); // Wait for the route ID retrieval
            await this.getData();

            const fields = await this.fetchModelFields();

            console.log('this.state.selectedMachineRoute : ', this.state.selectedMachineRoute);
            console.log('this.state.machines : ', this.state.machines);
            console.log('this.state.machineType : ', this.state.machineType);
            console.log('this.state.formattedRouteData : ', this.state.formattedRouteData);
            console.log('this.state.formattedRouteData : ', fields);
        });
        this.state.notification =useService("notification");
        this.retrieveSelectedIdForRoute = this.retrieveSelectedIdForRoute.bind(this);
    }

    async getData(){
        const { savedRouteId } = this.state;
        this.state.selectedMachineRoute = await this.orm.searchRead("machine.routing", [['orderId', '=', savedRouteId]], ['machineId', 'delay', 'route_name', 'orderId']);
        this.state.machines = await this.orm.searchRead("bleaching.machines",[['id', 'in', this.state.selectedMachineRoute.map(item => item.machineId)]],["id", "machine_name", "machine_type"]);

        const machineTypeIds = this.state.machines.map(machine => machine.machine_type[0]).filter(id => typeof id === 'number');
        this.state.machineType = await this.orm.searchRead("bleaching_machine.types",[['id', 'in', machineTypeIds]],['id', 'machine_type_name', 'machineParams']);

            // Construct the 'formattedRouteData' array
        this.state.formattedRouteData = this.state.machines.map(machine => {
            const machineTypeId = machine.machine_type[0];
            const machineTypeData = this.state.machineType.find(type => type.id === machineTypeId);
            const machineParamsArray = machineTypeData && machineTypeData.machineParams ? machineTypeData.machineParams.split(',') : [];
            return {
                machine_id: machine.id,
                machine_name: machine.machine_name,
                machine_type_id: machineTypeId,
                machine_params: machineParamsArray
            };
        });
    }

    async fetchModelFields() {
        const response = await fetch('/api/params_fields/get_model_fields', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json();
        return result.fields;
    }


    retrieveSelectedIdForRoute() {
        const url = new URL(window.location.href);
        const selectedIdForRoute = url.searchParams.get("selectedIdForRoute");
        this.state.savedRouteId = parseInt(selectedIdForRoute);
        console.log('this.state.savedRouteId :', this.state.savedRouteId);
    }

    generateRandomNumber() {
        const randomNum = Math.floor(Math.random() * 10000000);
        return randomNum;
    }
}
MachineParams.template = 'bleaching_dept.MachineParamsTemplate';
registry.category('actions').add('bleaching_dept.machine_params_js', MachineParams);