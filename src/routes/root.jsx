import {useRef, useEffect, useState, startTransition} from 'react';
import {Outlet} from 'react-router-dom';
import {useNavigate} from 'react-router-dom';

import {Menubar} from 'primereact/menubar';
import {Menu} from 'primereact/menu';
import {Button} from 'primereact/button';
import {Avatar} from 'primereact/avatar';
import {Toast} from 'primereact/toast';
import {InputText} from 'primereact/inputtext';

import {useBackend} from '../lib/usebackend.js';

import {Dialog} from 'primereact/dialog';

import Login from '../components/login.jsx';

import useUserStore from '../stores/user.js';
import TopNavbar from '../components/AppBar.jsx';
import {useToast} from '../hooks/use-toast.js';
import {Toaster} from '../components/ui/toaster.jsx';
import {LogOut, User} from 'lucide-react';

export default function Root() {
  const navigate = useNavigate();
  const userMenu = useRef(null);
  //const [newItems, setNewItems] = useState([]);
  const logout = useUserStore((state) => state.logout);
  const userId = useUserStore((state) => state.userId);
  const setToast = useUserStore((state) => state.setToast);
  const {toast: shadToast} = useToast();
  const authenticated = useUserStore((state) => state.authenticated);
  const toast = useRef(null);
  const errorMessage = useUserStore((state) => state.errorMessage);
  const clearErrorMessage = useUserStore((state) => state.clearErrorMessage);

  const [newItems] = useBackend({
    packageName: 'core',
    className: 'menu',
    methodName: 'getAllMenuItems',
    filter: (data) => buildMenu(data.data, navigate),
    clear: !authenticated,
    args: {authenticated}, // getAllMenuItems doesn't take any arguments. But this forces a data refresh when the user logs in or out.
  });
  const sendToast = (toastObject) => {
    console.log(toastObject, 'toast');
    shadToast({
      summary: toastObject.summary,
      description: toastObject.detail,
      life: 3000,
      variant: toastObject.severity,
    });
  };

  useEffect(() => {
    setToast(sendToast); // This works. Possibly a bad idea.
  }, []);

  const errorFooter = () => {
    return (
      <div>
        <Button
          label="Ok"
          onClick={clearErrorMessage}
          autoFocus
          severity="danger"
        />
      </div>
    );
  };

  const userItems = [
    {
      label: 'Profile',
      icon: 'User',
      command: () => {
        navigate(`/core/user/${userId}`);
      },
    },
    {
      label: 'Logout',
      icon: 'LogOut',
      command: () => {
        logout();
        navigate('/');
      },
    },
  ];

  return (
    <>
      <Dialog
        header="Error"
        visible={errorMessage}
        onHide={clearErrorMessage}
        footer={errorFooter}
        modal
      >
        The server has reported an error.
        <br />
        <br />
        {errorMessage}
      </Dialog>
      <Toaster />
      <TopNavbar
        navItems={newItems}
        userItems={userItems}
        onSearch={(val) => navigate(`/search?value=${val}`)}
      />
      {/* <Menubar model={newItems} className="mb-1" end={end} /> */}
      <Login>
        <Outlet />
      </Login>
    </>
  );
}

function buildMenu(items, navigate) {
  let output = [];

  for (const item of Object.keys(items).sort(
    (a, b) => items[a].order - items[b].order,
  )) {
    let itemoutput = {};

    // If it has children, process them first
    if (items[item].children && Object.keys(items[item].children).length > 0) {
      itemoutput.items = buildMenu(items[item].children, navigate);
    }

    itemoutput.label = items[item].label;

    if (items[item].view) {
      itemoutput.command = () => {
        startTransition(() => {
          navigate(items[item].navigate, {
            state: {
              view: items[item].view,
              filter: items[item].filter,
              tableHeader: items[item].label,
            },
          });
        });
      };
    }

    if (items[item].icon) {
      itemoutput.icon = items[item].icon;
    }

    output.push(itemoutput);
  }
  return output;
}
