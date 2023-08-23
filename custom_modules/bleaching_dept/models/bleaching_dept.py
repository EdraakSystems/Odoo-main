from odoo import models, fields, api, registry, SUPERUSER_ID, sql_db, http, tools
import json, odoo, uuid, time, openpyxl,  io


class PpcOrderView(http.Controller):
    @http.route('/api/ppc_order_view/get_model_fields', type='http', auth='user', methods=['POST'], csrf=False)
    def get_model_fields(self, **kw):
        try:
            model = http.request.env['order.data']
            fields = model.fields_get()
            return http.Response(json.dumps({'fields': fields}), content_type='application/json')
        except Exception as e:
            return http.Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)


class ParamsFields(http.Controller):
    @http.route('/api/params_fields/get_model_fields', type='http', auth='user', methods=['POST'], csrf=False)
    def get_model_fields(self, **kw):
        try:
            model = http.request.env['bleaching.machines.params']
            fields = model.fields_get()
            return http.Response(json.dumps({'fields': fields}), content_type='application/json')
        except Exception as e:
            return http.Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)


class RecipeFields(http.Controller):
    @http.route('/api/recipe_fields/get_model_fields', type='http', auth='user', methods=['POST'], csrf=False)
    def get_model_fields(self, **kw):
        try:
            model = http.request.env['bleaching.machines.recipe']
            fields = model.fields_get()
            return http.Response(json.dumps({'fields': fields}), content_type='application/json')
        except Exception as e:
            return http.Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)


class BleachingDept(models.Model):
    _name = "bleaching.dept"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Bleaching Dept"

    ppLot = fields.Integer(string='PP Lot Number')


class BleachingMachineTypes(models.Model):
    _name = "bleaching_machine.types"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Bleaching Dept Machine Types"

    machine_type_name = fields.Char(string='Machine Type Name')
    machineParams = fields.Char(string='Machine Params')
    machineRecipes = fields.Char(string='Machine Recipes')

    def name_get(self):
        result = []
        for record in self:
            name = record.machine_type_name
            result.append((record.id, name))
        return result


class BleachingMachines(models.Model):
    _name = "bleaching.machines"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Bleaching Dept Machines"

    machine_type = fields.Many2one('bleaching_machine.types', string='Machine Type', required=True, create=False)
    machine_name = fields.Char(string='Machine Name')
    underMaintenance = fields.Boolean(string='Machine Under Maintenance', default=False)


class MachineRoute(models.Model):
    _name = 'machine.routing'
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Machine Routes"

    orderId = fields.Integer(string='OrderId')
    route_name = fields.Char(string='Machine Route Name')
    machineId = fields.Integer(string='Machine Id')
    delay = fields.Integer(string='Delay value')
    status = fields.Char(string='Machine Status')


class MachineRouteHistory(models.Model):
    _name = 'machine.routing.history'
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Machine Routes History"

    orderId = fields.Integer(string='OrderId')
    machineId = fields.Integer(string='Machine Id')
    routeHistory = fields.Char(string='Machine Route History')

class BleachingMachineParams(models.Model):
    _name = "bleaching.machines.params"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Bleaching Machine Params"

    orderId = fields.Char(string='Order Id')
    machineId = fields.Char(string='Machine Id')
    speed = fields.Char(string='Speed')
    chemicalTemp = fields.Char(string='Chemical Temperature')
    flamePressure = fields.Char(string='Flame Pressure')
    positionBurner = fields.Char(string='Position Burner')
    distance = fields.Char(string='Distance')
    fabricTemp = fields.Char(string='Fabric Temperature')
    cameraSetting = fields.Char(string='Camera Setting')
    brushingSetting1 = fields.Char(string='Brushing Setting 1')
    brushingSetting2 = fields.Char(string='Brushing Setting 2')
    brushingSetting3 = fields.Char(string='Brushing Setting 3')
    brushingSetting4 = fields.Char(string='Brushing Setting 4')
    brushingSetting5 = fields.Char(string='Brushing Setting 5')
    brushingSetting6 = fields.Char(string='Brushing Setting 6')
    cone = fields.Char(string='Cone')
    burnerFace = fields.Char(string='Burner Face')
    burnerBack = fields.Char(string='Burner Back')
    entryWidth = fields.Char(string='Entry Width')
    exitWidth = fields.Char(string='Exit Width')
    chamberTemp1 = fields.Char(string='Chamber Temperature 1')
    chamberTemp2 = fields.Char(string='Chamber Temperature 2')
    chamberTemp3 = fields.Char(string='Chamber Temperature 3')
    widthBefore = fields.Char(string='Width Before')
    widthAfter = fields.Char(string='Width After')
    widthChain = fields.Char(string='Width Chain')
    d_tension = fields.Char(string='D/Tension')
    drumRPM = fields.Char(string='Drum RPM')
    exitDeliveryBrush = fields.Char(string='Exit Delivery Brush')
    topClearingBrushDistance = fields.Char(string='Top Clearing Brush Distance')
    upperBrush = fields.Char(string='Upper Brush')
    tensionWarp = fields.Char(string='Tension Warp')
    pressureLeft = fields.Char(string='Pressure Left')
    pressureRight = fields.Char(string='Pressure Right')
    emery = fields.Char(string='Emery')
    scouringTime = fields.Char(string='Scouring Time')
    bleachingTime = fields.Char(string='Bleaching Time')


class BleachingMachineParamsHistory(models.Model):
    _name = "bleaching.machines.params.history"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Bleaching Machine Params"

    orderId = fields.Char(string='Order Id')
    machineId = fields.Char(string='Machine Id')
    paramHistory = fields.Char(string='Param History')


class BleachingMachineRecipe(models.Model):
    _name = "bleaching.machines.recipe"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Bleaching Machine Recipe"

    orderId = fields.Char(string='Order Id')
    machineId = fields.Char(string='Machine Id')
    hydrogenPeroxide = fields.Char(string='Hydrogen Peroxide(H2O2)')
    sodiumHypochlorite = fields.Char(string='Sodium Hypochlorite(NaClO)')
    sodiumPercarbonate = fields.Char(string='Sodium Percarbonate(2Na2CO3·3H2O2)')
    sodiumMetabisulfite = fields.Char(string='Sodium MetabisulfiteSodium(Na2S2O5)')
    sodiumHydroxide = fields.Char(string='Sodium Hydroxide(NaOH)')
    aceticAcid = fields.Char(string='Acetic Acid(CH3COOH)')


class BleachingMachineRecipeHistory(models.Model):
    _name = "bleaching.machines.recipe.history"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Bleaching Machine Recipe History"

    orderId = fields.Char(string='Order Id')
    machineId = fields.Char(string='Machine Id')
    recipeHistory = fields.Char(string='Recipe History')