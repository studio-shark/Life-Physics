import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface LoginButtonProps {
  onSuccess: (credential: string) => void;
  onError?: () => void;
}

const LoginButton: React.FC<LoginButtonProps> = ({ onSuccess, onError }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <GoogleLogin
        onSuccess={(credentialResponse: CredentialResponse) => {
          if (credentialResponse.credential) {
            onSuccess(credentialResponse.credential);
          }
        }}
        onError={() => {
          console.error('Login Failed');
          if (onError) onError();
        }}
        useOneTap
        theme="filled_black"
        shape="circle"
        text="signin_with"
      />
    </div>
  );
};

export default LoginButton;