import {useState} from 'react';

import {Dialog} from 'primereact/dialog';
import CreateRecord from '../record.jsx';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '../ui/tooltip.jsx';
import {Button} from '../ui/button.jsx';

export default function AddRecordButton({
  db,
  table,
  onClose,
  closeOnCreate,
  header = 'Create Record',
  disabled = false,
  where,
}) {
  const [showDialog, setShowDialog] = useState(false);

  const openDialog = () => setShowDialog(true);
  const closeDialog = (id) => {
    setShowDialog(false);
    if (onClose) {
      onClose(id);
    }
  };

  return (
    <>
      {/* <Button
        icon="pi pi-plus"
        className="mx-1"
        onClick={openDialog}
        tooltip="Create record"
        disabled={disabled}
        visible={!disabled} // TODO decide if we want to hide the button or just disable it. For ticketing, we want to hide it. Other apps? probably disable.
      /> */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={() => {
                openDialog();
              }}
              key="viewRelatedRecord"
            >
              <i className="pi pi-plus" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Create record</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog
        header={header}
        visible={showDialog}
        style={{width: '50vw'}}
        onHide={closeDialog}
        draggable={false}
      >
        <CreateRecord
          db={db}
          table={table}
          onClose={(id) => {
            closeDialog(id);
          }}
          where={where}
          closeOnCreate={closeOnCreate}
        />
      </Dialog>
    </>
  );
}
