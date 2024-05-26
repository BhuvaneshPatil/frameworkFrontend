import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from 'primereact/button';

import { Tooltip } from 'primereact/tooltip';
import Fields from './fields/index.jsx';

import ActionButton from './buttons/actionbutton.jsx';

import { formatDateTime, unFormatDateTime } from './util.js';

import { useBackend, callBackend } from '../lib/usebackend.js';
import CreateRecord from './buttons/createrecord.jsx';

import './record.css';

export default function Record({
  db,
  table,
  recordId,
  onClose,
  closeOnCreate = false,
  where = [],
  reload,
  forceReload,
}) {
  const [error, setError] = useState(null);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  const schema = useBackend({
    packageName: db,
    className: table,
    methodName: 'schemaGet',
    cache: true,
  });

  const buttons = useBackend({
    packageName: db,
    className: table,
    methodName: 'actionsGet',
  });

  let record = null;
  let newRecord = true;
  if (recordId) {
    // this is ok because this component will never be rendered as a new record and then again as an existing component
    record = useBackend({
      packageName: db,
      className: table,
      methodName: 'recordGet',
      recordId,
      args: {},
      reload,
    });
    newRecord = false;
  }

  // Load in where clauses. This is for creating related records. It prepoulates the form with the related fields.
  if (newRecord && where.length > 0 && Object.keys(formData).length == 0) {
    for (const whereClause of where) {
      setFormData((formData) => ({
        ...formData,
        ...whereClause,
      }));
    }
  }

  useEffect(() => {
    if (record) {
      const newRecord = record.data;

      // Convert datetime fields to a human readable format
      Object.entries(schema?.data?.schema || {}).forEach(
        ([columnId, settings]) => {
          if (settings.columnType === 'datetime') {
            newRecord[columnId] = formatDateTime(newRecord[columnId]);
          }
        }
      );

      setFormData(newRecord);
    }
  }, [record]);

  const getDropDownOptions = async (columnId, settings) => {
    if (settings.join) {
      try {
        const response = await callBackend({
          packageName: settings.joinDb,
          className: settings.join,
          methodName: 'rowsGet',
          args: {
            columns: ['id', settings.friendlyColumnName],
            queryModifier: settings.queryModifier,
          },
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        response.data.rows.push({ id: null, name: 'None' });

        setDropdownOptions((prevOptions) => ({
          ...prevOptions,
          [columnId]: response.data.rows,
        }));
      } catch (err) {
        console.error('Error fetching dropdown options:', err);
      }
    }
  };

  // Fetch the dropdown options for each dropdown field
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      for (const [columnId, settings] of Object.entries(
        schema?.data?.schema || {}
      )) {
        getDropDownOptions(columnId, settings);
      }

      if (newRecord && schema?.data?.schema?.id) {
        const temp = {};
        for (const [columnId, settings] of Object.entries(schema.data.schema)) {
          if (settings.defaultValue) {
            temp[columnId] = settings.defaultValue;
          }
        }

        setFormData((formData) => ({ ...formData, ...temp }));
        console.log('new record sent!', temp);
        return;
      }
    };

    if (schema?.data?.schema) {
      fetchDropdownOptions();
    }
  }, [schema]);

  const handleChange = (columnId, value) => {
    setFormData({
      ...formData,
      [columnId]: value,
    });
  };

  // Create a record
  const handleSubmit = async (params) => {
    setError(null);

    const postData = { ...formData };

    Object.entries(schema?.data?.schema).forEach(([columnId, settings]) => {
      if (settings.columnType === 'datetime') {
        postData[columnId] = unFormatDateTime(formData[columnId]);
      }
    });

    try {
      const response = await callBackend({
        packageName: db,
        className: table,
        methodName: 'recordCreate',
        args: {
          data: postData,
        },
      });

      if (!response.ok) {
        throw new Error('Server response was not ok', response);
      }

      if (onClose) {
        onClose(response.data.id);
      }

      if (!closeOnCreate) {
        navigate(`/${db}/${table}/${response.data.id}`);
      } else {
        if (onClose) {
          onClose();
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      // nothing
    }
  };

  if (error) return <p>Error: {error}</p>;

  const renderInputField = (columnId, settings) => {
    if (settings.join) {
      settings.fieldType = 'reference';
    }

    if (!Fields[settings.fieldType]) {
      settings.fieldType = 'inputtext';
    }

    if (settings.readOnly) {
      settings.fieldType = 'readOnly';
    }

    let value = formData[columnId];

    const Field = Fields[settings.fieldType];

    return (
      <Field
        columnId={columnId}
        settings={settings}
        dropdownOptions={dropdownOptions ? dropdownOptions[columnId] : []}
        value={value}
        handleChange={handleChange}
      />
    );
  };

  if (!formData) return <p>Loading...</p>;

  return (
    <>
      <h2>{newRecord ? '' : 'Update ' + schema?.data?.name}</h2>
      <Tooltip target=".tooltip" />
      <form onSubmit={(e) => e.preventDefault()}>
        {Object.entries(schema?.data?.schema || {}).map(
          ([columnId, settings]) => {
            if (settings.table != table) return;
            if (settings.primaryKey) return;
            if (settings.hidden) return;
            if (settings.hiddenRecord) return;
            if (settings.hiddenCreate && newRecord) return;
            if (settings.hiddenUpdate && !newRecord) return;
            if (
              where &&
              where.some((obj) => obj.hasOwnProperty(columnId)) &&
              newRecord
            )
              return; // Dont show the column that contains a forgien key that was supplied for new records

            return (
              <div className="field grid" key={columnId}>
                <label
                  htmlFor={columnId}
                  className="col-12 mb-2 md:col-2 md:mb-0 nowrap align-content-end formLabel"
                >
                  <div
                    data-pr-tooltip={settings.helpText}
                    data-pr-position="top"
                    className="tooltip"
                  >
                    {settings.friendlyName || columnId}
                  </div>
                </label>
                <div className="col-12 md:col-10">
                  {renderInputField(columnId, settings)}
                  {
                    //TODO move these into the reference field component
                  }
                  {settings.join && (
                    <>
                      {formData[columnId] && (
                        <Button
                          icon="pi pi-external-link"
                          className="ml-1"
                          onClick={() => {
                            navigate(
                              `/${settings.joinDb}/${settings.join}/${formData[columnId]}`
                            );
                          }}
                          tooltip="View related record"
                          key="viewRelatedRecord"
                        />
                      )}
                      {settings.referenceCreate && (
                        <CreateRecord
                          db={settings.joinDb}
                          table={settings.join}
                          onClose={async (id) => {
                            await getDropDownOptions(columnId, settings);
                            if (id) {
                              setFormData((formData) => ({
                                ...formData,
                                [columnId]: id,
                              }));
                            }
                          }}
                          closeOnCreate={true}
                          header="Create Record"
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          }
        )}
        <div className="field grid" key="submitbutton">
          <div className="col-12 mb-2 md:col-2 md:mb-0 nowrap align-content-end formLabel"></div>
          <div className="col-12 md:col-10">
            {newRecord && (
              <>
                <Button
                  type="submit"
                  label="Create"
                  tooltip="Create the record"
                  tooltipOptions={{ position: 'top' }}
                  className="mr-1 mb-1"
                  onClick={() => {
                    handleSubmit({ close: false });
                  }}
                />
                <Button
                  type="button"
                  label="Cancel"
                  tooltip="Cancel and go back"
                  tooltipOptions={{ position: 'top' }}
                  severity="secondary"
                  className="mr-1 mb-1"
                  onClick={() => {
                    if (onClose) {
                      onClose();
                    }
                  }}
                />
              </>
            )}
            {!newRecord &&
              buttons &&
              buttons.data.map((button) => {
                return (
                  <ActionButton
                    button={button}
                    key={button.id}
                    db={db}
                    table={table}
                    recordId={recordId}
                    forceReload={forceReload}
                    reload={reload}
                    formData={formData}
                    columns={schema.data.schema}
                  />
                );
              })}
          </div>
        </div>
      </form>
    </>
  );
}
