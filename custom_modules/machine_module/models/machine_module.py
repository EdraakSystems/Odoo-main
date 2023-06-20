from odoo import models, fields, api, registry, SUPERUSER_ID, sql_db, http, tools
import json, odoo, uuid, time, openpyxl,  io
from odoo.http import request, Response
import pandas as pd

class ExcelData(http.Controller):

    @http.route('/machine_module/get_csrf_token', type='http', auth='public', csrf=False)
    def get_csrf_token(self, **post):
        csrf_token = request.csrf_token()
        return Response(json.dumps({'csrf_token': csrf_token}), content_type='application/json')

    @http.route('/machine_module/upload_excel_file', type='http', auth='public', csrf=False)
    def upload_excel_file(self, **post):
        # Get the uploaded file and CSRF token
        uploaded_file = request.httprequest.files.get('file')
        csrf_token = post.get('csrf_token')

        # Handle the uploaded file and CSRF token
        if uploaded_file and csrf_token:
            # Check if the file is of Excel type
            allowed_file_types = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
            if uploaded_file.content_type in allowed_file_types:
                print('Uploaded file is of Excel type')

                # Read the Excel file using pandas
                df = pd.read_excel(uploaded_file)

                # Convert DataFrame to JSON
                df_json = df.to_json()

                return df_json
            else:
                print('Invalid file type. Only Excel files are allowed.')
                return json.dumps({'success': False, 'message': 'Invalid file type. Only Excel files are allowed.'})
        else:
            return json.dumps({'success': False, 'message': 'Invalid file or CSRF token'})



class MachineDataController(http.Controller):
    @http.route('/machine_module/js_function', type='json', auth='public')
    def js_function(self, **kwargs):
        # Get the request data and parse it as JSON
        request_data = http.request.httprequest.get_data()
        request_data = json.loads(request_data.decode('utf-8'))

        var1 = request_data.get('var1')

        print("var1:", var1)

        store_value()
        odoo_version()
        # fetch_and_print_value()
        create_dynamic_column(var1, 'char')
        # delete_dynamic_column('ateeq')

        # Response
        return {"message": "Python function executed successfully"}

def store_value():
    cr = sql_db.db_connect('nishat_odoo_db').cursor()
    # Update the value using SQL
    update_query = "UPDATE machine_data SET ggs = 'Q' WHERE id = 5"
    cr.execute(update_query)

    cr.commit()
    cr.close()

def odoo_version():
    # Specify the database name
    database_name = 'nishat_odoo_db'

    # Get the database cursor
    cr = sql_db.db_connect(database_name).cursor()

    # Execute the SQL query to retrieve the Odoo version
    cr.execute("SELECT latest_version FROM ir_module_module WHERE name = 'base' LIMIT 1")
    result = cr.fetchone()

    # Close the database cursor
    cr.close()

    if result:
        version = result[0]
        print("Current version of the Odoo database schema:", version)
    else:
        print("The 'base' module is not found.")


def fetch_and_print_value():
    # Get the database cursor
    cr = sql_db.db_connect('nishat_odoo_db').cursor()

    # Fetch the value using SQL
    select_query = "SELECT ggs FROM machine_data WHERE id = 1"
    cr.execute(select_query)
    result = cr.fetchone()

    if result:
        value = result[0]
        print("Value:", value)
    else:
        print("No value found")

    cr.close()

def create_dynamic_column(column_name, column_type):
    print("SQL RAN")
    table_name = 'machine_data'

    unique_identifier = str(uuid.uuid4())[:8]  # Using the first 8 characters of the UUID
    timestamp = int(time.time())  # Get the current timestamp

    # Get the database cursor
    cr = sql_db.db_connect('nishat_odoo_db').cursor()

    # Generate a unique model name
    model_name = f"x_machine_data_{unique_identifier}_{timestamp}"

    try:
        alter_table_query = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
        cr.execute(alter_table_query)

        # Update the ir.model.fields table
        insert_field_query = """
            INSERT INTO ir_model_fields (name, field_description, ttype, model, model_id, state)
            VALUES (%s, %s, %s, %s, (SELECT id FROM ir_model WHERE model = %s), 'manual')
        """
        field_description_json = json.dumps(column_name)
        cr.execute(insert_field_query, (column_name, field_description_json, column_type.lower(), 'machine.data', 'machine.data'))

        cr.commit()

        # Create a new model that inherits from the original model and adds the new field
        class_name = f"MachineData{column_name.capitalize()}_{unique_identifier}_{timestamp}"
        new_model = type(class_name, (MachineDetailss,), {
            "__module__": MachineDetailss.__module__,
            "_inherit": model_name,
            column_name: fields.Float(string=column_name.capitalize())
        })

        # Create a new record for the dynamic model in the registry
        with api.Environment.manage():
            env = api.Environment(cr, odoo.SUPERUSER_ID, {})
            model_obj = env['ir.model']
            model_obj.create({
                'name': new_model._name,
                'model': new_model._name,
                'state': 'manual',
            })

    finally:
        cr.close()


# DELETE THE COLUMN
def delete_dynamic_column(column_name):
    print("SQL RAN")
    table_name = 'machine_data'

    # Get the database cursor
    cr = sql_db.db_connect('nishat_odoo_db').cursor()

    try:
        # Drop the column from the table
        alter_table_query = f"ALTER TABLE {table_name} DROP COLUMN {column_name}"
        cr.execute(alter_table_query)

        # Delete the corresponding field from the ir.model.fields table
        delete_field_query = """
            DELETE FROM ir_model_fields WHERE model = %s AND name = %s
        """
        cr.execute(delete_field_query, ('machine.data', column_name))

        cr.commit()

        # Delete the dynamic model from the registry
        with api.Environment.manage():
            env = api.Environment(cr, odoo.SUPERUSER_ID, {})
            model_obj = env['ir.model']
            model = model_obj.search([('model', '=', f"machine.data_{column_name}")])
            model.unlink()

    finally:
        cr.close()

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




# PERFECT WORKING WITHOUT SCHEMA


#
#









# This was able to create the column but column is not registered.
# def create_dynamic_column(db_name, column_name, column_type):
#     field_type_mapping = {
#         'FLOAT': fields.Float,
#         'CHAR': fields.Char,
#         'INTEGER': fields.Integer,
#         # Add other mappings if needed
#     }
#
#     field_type = field_type_mapping.get(column_type.upper())
#     if not field_type:
#         raise ValueError(f"Unsupported column type: {column_type}")
#
#     with odoo.registry(db_name).cursor() as new_cr:
#         env = api.Environment(new_cr, SUPERUSER_ID, {})
#         machine_data_model = env['machine.data']
#         new_field = field_type(string=column_name)
#         machine_data_model._add_field(column_name, new_field)
#         columns = env['ir.model.fields'].search([('model', '=', machine_data_model._name)])
#         columns_dict = {column.name: column for column in columns}
#         new_field.update_db(machine_data_model, columns_dict)
#         new_cr.commit()








# def create_dynamic_column(column_name, column_type):
#     print("SQL RAN")
#     table_name = 'machine_data'
#
#     # Get the database cursor
#     cr = sql_db.db_connect('nishat_odoo_db').cursor()
#
#     alter_table_query = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
#     cr.execute(alter_table_query)
#
#     # Update the ir.model.fields table
#     insert_field_query = f"""
#         INSERT INTO ir_model_fields (name, field_description, ttype, model, model_id, state)
#         VALUES (%s, %s, %s, %s, (SELECT id FROM ir_model WHERE model = %s), 'manual')
#     """
#     field_description_json = json.dumps(column_name)
#     cr.execute(insert_field_query, (column_name, field_description_json, column_type.lower(), 'machine.data', 'machine.data'))
#
#     cr.commit()
#     cr.close()


# def create_dynamic_column(column_name, column_type):
#     print("SQL RAN")
#     table_name = 'machine_data'
#
#     # Get the database cursor
#     cr = sql_db.db_connect('nishat_odoo_db').cursor()
#
#     alter_table_query = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
#     cr.execute(alter_table_query)
#
#     cr.commit()
#     cr.close()








# def create_dynamic_column(column_name, column_type):
#     print("SQL RAN")
#     table_name = 'machine_data'
#
#     # Get the database cursor
#     cr = sql_db.db_connect('nishat_odoo_db').cursor()
#
#     alter_table_query = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
#     cr.execute(alter_table_query)
#
#     # Update the ir.model.fields table
#     insert_field_query = f"""
#         INSERT INTO ir_model_fields (name, field_description, ttype, model, model_id, state)
#         VALUES (%s, %s, %s, %s, (SELECT id FROM ir_model WHERE model = %s), 'manual')
#     """
#     field_description_json = json.dumps(column_name)
#     cr.execute(insert_field_query, (column_name, field_description_json, column_type.lower(), 'machine.data', 'machine.data'))
#
#     cr.commit()
#     cr.close()
#
#     # Create a new model that inherits from the original model and adds the new field
#     class_name = f"MachineData{column_name.capitalize()}"
#     new_model = type(class_name, (MachineDetailss,), {
#         "__module__": MachineDetailss.__module__,
#         "_inherit": "machine.data",
#         column_name: fields.Float(string=column_name.capitalize())
#     })
#
#     # Update the registry with the new model
#     with odoo.api.Environment.manage():
#         env = odoo.api.Environment(odoo.api.Environment().cr, odoo.api.SUPERUSER_ID, {})
#         env.registry.update(new_model._name, new_model)


# def create_dynamic_column(column_name, column_type):
#     print("SQL RAN")
#     table_name = 'machine_data'
#
#     # Get the database cursor
#     cr = sql_db.db_connect('nishat_odoo_db').cursor()
#
#     alter_table_query = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
#     cr.execute(alter_table_query)
#
#     # Update the ir.model.fields table
#     insert_field_query = f"""
#         INSERT INTO ir_model_fields (name, field_description, ttype, model, model_id, state)
#         VALUES (%s, %s, %s, %s, (SELECT id FROM ir_model WHERE model = %s), 'manual')
#     """
#     field_description_json = json.dumps(column_name)
#     cr.execute(insert_field_query, (column_name, field_description_json, column_type.lower(), 'machine.data', 'machine.data'))
#
#     cr.commit()
#     cr.close()
#
#     # Create a new model that inherits from the original model and adds the new field
#     class_name = f"MachineData{column_name.capitalize()}"
#     new_model = type(class_name, (MachineDetailss,), {
#         "__module__": MachineDetailss.__module__,
#         "_inherit": "machine.data",
#         column_name: fields.Float(string=column_name.capitalize())
#     })
#
#     # Update the registry with the new model
#     # Update the registry with the new model
#     with api.Environment.manage():
#         env = api.Environment(cr, odoo.SUPERUSER_ID, {})
#         model_obj = env['ir.model']
#         model_obj.create({
#             'name': new_model._name,
#             'model': new_model._name,
#             'state': 'manual',
#         })



# def create_dynamic_column(column_name, column_type):
#     print("SQL RAN")
#     table_name = 'machine_data'
#
#
#     unique_identifier = str(uuid.uuid4())[:8]  # Using the first 8 characters of the UUID
#
#
#     # Get the database cursor
#     cr = sql_db.db_connect('nishat_odoo_db').cursor()
#
#     try:
#         alter_table_query = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
#         cr.execute(alter_table_query)
#
#         # Update the ir.model.fields table
#         insert_field_query = """
#             INSERT INTO ir_model_fields (name, field_description, ttype, model, model_id, state)
#             VALUES (%s, %s, %s, %s, (SELECT id FROM ir_model WHERE model = %s), 'manual')
#         """
#         field_description_json = json.dumps(column_name)
#         cr.execute(insert_field_query, (column_name, field_description_json, column_type.lower(), 'machine.data', 'machine.data'))
#
#         cr.commit()
#
#         # Create a new model that inherits from the original model and adds the new field
#         # class_name = f"MachineData{column_name.capitalize()}"
#         class_name = f"MachineData{column_name.capitalize()}_{unique_identifier}"
#         new_model = type(class_name, (MachineDetailss,), {
#             "__module__": MachineDetailss.__module__,
#             "_inherit": "machine.data",
#             column_name: fields.Float(string=column_name.capitalize())
#         })
#
#         # Create a new record for the dynamic model in the registry
#         with api.Environment.manage():
#             env = api.Environment(cr, odoo.SUPERUSER_ID, {})
#             model_obj = env['ir.model']
#             model_obj.create({
#                 'name': new_model._name,
#                 'model': new_model._name,
#                 'state': 'manual',
#             })
#
#     finally:
#         cr.close()



# def create_dynamic_column(column_name, column_type):
#     print("SQL RAN")
#     table_name = 'machine_data'
#
#     # Get the database cursor
#     cr = sql_db.db_connect('nishat_odoo_db').cursor()
#
#     alter_table_query = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
#     cr.execute(alter_table_query)
#
#     # Update the ir.model.fields table
#     insert_field_query = f"""
#         INSERT INTO ir_model_fields (name, field_description, ttype, model, model_id, state)
#         VALUES (%s, %s, %s, %s, (SELECT id FROM ir_model WHERE model = %s), 'manual')
#     """
#     field_description_json = json.dumps(column_name)
#     cr.execute(insert_field_query, (column_name, field_description_json, column_type.lower(), 'machine.data', 'machine.data'))
#
#     cr.commit()
#     cr.close()


