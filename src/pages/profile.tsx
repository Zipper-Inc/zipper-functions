import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const Profile = () => {
  const session = useSession();

  const [sessionString, setSessionString] = useState('');

  useEffect(() => {
    setSessionString(JSON.stringify(session, null, 2).replace(' ', ''));
  }, [session]);

  return (
    <div>
      <div>
        <h2>Your session detail</h2>
        <p>Below is your session object for this login.</p>
        <p>{sessionString}</p>
      </div>
    </div>
  );
};

export default Profile;
