from odoo import models, fields, api, registry, SUPERUSER_ID, sql_db, http, tools


class MachineDataController(http.Controller):
    @http.route('/machine_module/js_function', type='json', auth='public')
    # def js_function(self, **kwargs):
    #     print('I got called')

    def js_function(self, **kwargs):
        field_names = []
        model = 'machine.params'  # Replace with the actual model name

        # Fetch the field names of the model
        fields = http.request.env[model]._fields
        for field_name, field_obj in fields.items():
            field_names.append(field_name)

        print('I got called')
        print('Fields:', field_names)

        return field_names


class MachineDetailss(models.Model):
    _name = "machine.data"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Machines Data"

    machineName = fields.Char(string='Machine Name', tracking=True)
    ppLotNum = fields.Char(string='PP Lot Num', tracking=True)
    fabricType = fields.Selection([('flat', 'Flat'), ('lycra', 'Lycra')], string='Fabric Type', tracking=True)
    quality = fields.Char(string='Quality', tracking=True)
    shade = fields.Char(string='Shade', tracking=True)
    jobCard = fields.Char(string='Job Card', tracking=True)
    greyMeter = fields.Char(string='Grey Meter', tracking=True)
    contract = fields.Char(string='Contract', tracking=True)
    planApprove = fields.Boolean(string='PPC Plan Approve', default=False, tracking=True)
    departmentNames = fields.Selection([('finishing', 'Finishing'), ('dying', 'Dying')], string='Departments',
                                       tracking=True)
    dispatch_date = fields.Date(string='Dispatch Date')
    executionApproval = fields.Boolean(string='Machine Execution Approval', default=False, tracking=True)
    reprocess = fields.Boolean(string='Reprocess', default=False, tracking=True)
    red_alert = fields.Boolean(string='Red Alert', default=False)
    machineRoute = fields.Char(string='Machine Route')
    extraField2 = fields.Char(string='Extra Field')
    anotherExtraField = fields.Char(string='Extra Field')

class MachinesDetails(models.Model):
    _name = "machine.details"
    _description = "Machine Details"

    subMachines = fields.Char(string='Machine Name', required=True)
    nameOfMachines = fields.Selection([('unrolling', 'Unrolling'), ('sienging', 'Sienging'), ('lbox', 'LBox'),
                                       ('mercerizing', 'Mercerizing'), ('curing', 'Curing'), ('laffer', 'Laffer'),
                                       ('danti', 'Danti'),
                                       ('suckermuler', 'Suckermuler'), ('raising', 'Raising & Shearing')],
                                      string="Machine Names", required=True)
    underMaintenance = fields.Boolean(string='Machine Under Maintenance', default=False)


class MachinesParams(models.Model):
    _name = "machine.params"
    _description = "Machine Parameters"

    machineId = fields.Integer(string='Machine Id')
    machineName = fields.Char(string='Machine Name')
    machineType = fields.Char(string='Machine Type')
    speed = fields.Float(string='Machine Speed')
    chemicalTemp = fields.Float(string='Chemical Temp')
    flamePressure = fields.Float(string='Flame Pressure')
    positionBurner = fields.Float(string='Position Burner')
    burnerDistance = fields.Float(string='Burner Distance')
    fabricTemp = fields.Float(string='Fabric Temp')
    rotationTime = fields.Float(string='Rotation Time')
    brushing3 = fields.Float(string='Brushing 3')
    brushing2 = fields.Float(string='Brushing 2')
    brushing1 = fields.Float(string='Brushing 1')
    Cone = fields.Char(string='Machine Cone')
    width = fields.Float(string='Width')

class MachinesR(models.Model):
    _name = "machine.rec"
    _description = "Machine Parameters"

    machineIdrec = fields.Integer(string='Machine Id')


# Creates columns and also updates the fields ORM doesn't read/writes
# @api.model
#     def create_dynamic_columns(self, column_name, column_type):
#         print("SQL RAN")
#         table_name = 'machine_data'
#
#         # env = http.request.env
#
#         # Get the database cursor
#         cr = sql_db.db_connect('nishat_odoo_db').cursor()
#
#         alter_table_query = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
#         cr.execute(alter_table_query)
#
#         # Update the ir.model.fields table
#         insert_field_query = """
#                     INSERT INTO ir_model_fields (name, field_description, ttype, model, model_id, state)
#                     VALUES (%s, %s, %s, %s, (SELECT id FROM ir_model WHERE model = %s), 'manual')
#                 """
#         field_description_json = json.dumps(column_name)
#         cr.execute(insert_field_query,
#                    (column_name, field_description_json, column_type.lower(), 'machine.data', 'machine.data'))
#         env = request.env
#
#         print(env)
#
#
#         cr.commit()
#         cr.close()

#
# def store_value():
#     cr = sql_db.db_connect('nishat_odoo_db').cursor()
#     # Update the value using SQL
#     update_query = "UPDATE machine_data SET ggs = 'Q' WHERE id = 5"
#     cr.execute(update_query)
#
#     cr.commit()
#     cr.close()
#
# def odoo_version():
#     # Specify the database name
#     database_name = 'nishat_odoo_db'
#
#     # Get the database cursor
#     cr = sql_db.db_connect(database_name).cursor()
#
#     # Execute the SQL query to retrieve the Odoo version
#     cr.execute("SELECT latest_version FROM ir_module_module WHERE name = 'base' LIMIT 1")
#     result = cr.fetchone()
#
#     # Close the database cursor
#     cr.close()
#
#     if result:
#         version = result[0]
#         print("Current version of the Odoo database schema:", version)
#     else:
#         print("The 'base' module is not found.")
#
#
# def fetch_and_print_value():
#     # Get the database cursor
#     cr = sql_db.db_connect('nishat_odoo_db').cursor()
#
#     # Fetch the value using SQL
#     select_query = "SELECT ggs FROM machine_data WHERE id = 1"
#     cr.execute(select_query)
#     result = cr.fetchone()
#
#     if result:
#         value = result[0]
#         print("Value:", value)
#     else:
#         print("No value found")
#
#     cr.close()
#
#
#
# # DELETE THE COLUMN
# def delete_dynamic_column(column_name):
#     print("SQL RAN")
#     table_name = 'machine_data'
#
#     # Get the database cursor
#     cr = sql_db.db_connect('nishat_odoo_db').cursor()
#
#     try:
#         # Drop the column from the table
#         alter_table_query = f"ALTER TABLE {table_name} DROP COLUMN {column_name}"
#         cr.execute(alter_table_query)
#
#         # Delete the corresponding field from the ir.model.fields table
#         delete_field_query = """
#             DELETE FROM ir_model_fields WHERE model = %s AND name = %s
#         """
#         cr.execute(delete_field_query, ('machine.data', column_name))
#
#         cr.commit()
#
#         # Delete the dynamic model from the registry
#         with api.Environment.manage():
#             env = api.Environment(cr, odoo.SUPERUSER_ID, {})
#             model_obj = env['ir.model']
#             model = model_obj.search([('model', '=', f"machine.data_{column_name}")])
#             model.unlink()
#
#     finally:
#         cr.close()