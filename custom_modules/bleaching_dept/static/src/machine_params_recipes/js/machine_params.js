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
            fields:[],
            recipeFields:[],
        });
        onWillStart(async () => {
            await this.retrieveSelectedIdForRoute(); // Wait for the route ID retrieval
            const fields = await this.fetchModelFields();
            this.state.fields = fields;
            this.state.recipeFields = await this.fetchRecipeFields();
            await this.getData();


            console.log('this.state.selectedMachineRoute : ', this.state.selectedMachineRoute);
            console.log('this.state.fields : ', this.state.fields);
            console.log('this.state.machines : ', this.state.machines);
            console.log('this.state.machineType : ', this.state.machineType);
            console.log('this.state.formattedRouteData : ', this.state.formattedRouteData);
            console.log('this.state.recipeFields : ', this.state.recipeFields);
        });
        this.state.notification =useService("notification");
        this.retrieveSelectedIdForRoute = this.retrieveSelectedIdForRoute.bind(this);
        this.getData = this.getData.bind(this);
        this.saveParams = this.saveParams.bind(this);
    }
    async getData() {
        const { savedRouteId } = this.state;
        this.state.selectedMachineRoute = await this.orm.searchRead("machine.routing", [['orderId', '=', savedRouteId]], ['machineId', 'delay', 'route_name', 'orderId']);
        this.state.machines = await this.orm.searchRead("bleaching.machines",[['id', 'in', this.state.selectedMachineRoute.map(item => item.machineId)]],["id", "machine_name", "machine_type"]);


        const machineTypeIds = this.state.machines.map(machine => machine.machine_type[0]).filter(id => typeof id === 'number');

        console.log('machineTypeIds : ',machineTypeIds);

        this.state.machineType = await this.orm.searchRead("bleaching_machine.types",[['id', 'in', machineTypeIds]],['id', 'machine_type_name', 'machineParams', 'machineRecipes']);
        // Construct the 'formattedRouteData' array
        this.state.formattedRouteData = this.state.machines.map(machine => {
            const machineTypeId = machine.machine_type[0];
            const machineTypeData = this.state.machineType.find(type => type.id === machineTypeId);
            const machineParamsArray = machineTypeData && machineTypeData.machineParams ? machineTypeData.machineParams.split(',') : [];
            const machineRecipesArray = machineTypeData && machineTypeData.machineRecipes ? machineTypeData.machineRecipes.split(',') : [];
            // Create 'machine_params' array using 'machineParamsArray' elements
            const machineParams = machineParamsArray.map(param => ({
                name: param,
                param_name: this.state.fields[param]?.string || '',
                param_type: this.state.fields[param]?.type || ''
            }));
            const machineRecipes = machineRecipesArray.map(recipe => ({
                name: recipe,
                recipe_name: this.state.recipeFields[recipe]?.string || '',
                recipe_type: this.state.recipeFields[recipe]?.type || ''
            }));

            console.log('machineRecipes : ', machineRecipes);

            return {
                machine_id: machine.id,
                machine_name: machine.machine_name,
                machine_type_id: machineTypeId,
                machine_params: machineParams,
                machine_recipes: machineRecipes,
            };
        });
    }
    async saveParams(event) {
        const machineId = event.target.getAttribute("machineId");
        console.log('machineId:', machineId);
        // Find the element in formattedRouteData with the given machineId
        const machineRoute = this.state.formattedRouteData.find(machine => machine.machine_id === parseInt(machineId, 10));
        if (machineRoute) {
            // Get an array of objects with param and its value for the corresponding tab
            const inputValues = machineRoute.machine_params.map(param => ({
                param: param.name,
                value: param.value
            }));
            console.log('Input values in the tab:', inputValues);
            // Create a new row in the table
            await this.orm.create("bleaching.machines.params", [{
                orderId: this.state.savedRouteId,
                machineId: machineId,
                ...Object.fromEntries(inputValues.map(({ param, value }) => [param, value]))
            }]);
            console.log('New row created with orderId:', this.state.savedRouteId, 'and machineId:', machineId);
        } else {
            console.log('Machine Route not found for machineId:', machineId);
        }
    }


    async saveRecipe(event) {
        const machineId = event.target.getAttribute("machineId");
        console.log('machineId:', machineId);
        // Find the element in formattedRouteData with the given machineId
        const machineRoute = this.state.formattedRouteData.find(machine => machine.machine_id === parseInt(machineId, 10));
        if (machineRoute) {
            // Get an array of objects with param and its value for the corresponding tab
            const inputValues = machineRoute.machine_recipes.map(recipe => ({
                recipe: recipe.name,
                value: recipe.value
            }));
            console.log('Input values in the tab:', inputValues);
            // Create a new row in the table
            await this.orm.create("bleaching.machines.recipe", [{
                orderId: this.state.savedRouteId,
                machineId: machineId,
                ...Object.fromEntries(inputValues.map(({ recipe, value }) => [recipe, value]))
            }]);
            console.log('New row created with orderId:', this.state.savedRouteId, 'and machineId:', machineId);
        } else {
            console.log('Machine Route not found for machineId:', machineId);
        }
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

    async fetchRecipeFields() {
        const response = await fetch('/api/recipe_fields/get_model_fields', {
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