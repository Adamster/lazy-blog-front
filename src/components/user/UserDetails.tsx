import { IUser } from '@/types';
import Image from 'next/image';

interface IProps {
  user: IUser;
}

export const UserDetails = ({ user }: IProps) => {
  return (
    <div className="container mx-auto">
      <div className="flex flex-wrap justify-center">
        <div className="w-48 h-48 rounded-full overflow-hidden">
          <Image
            src="/images/logo.png"
            alt="User avatar"
            width={300}
            height={300}
          />
        </div>
        <div className="ml-6">
          <h1 className="text-3xl font-bold">{user.userName}</h1>
          <p className="text-lg">User bio goes here...</p>
        </div>
      </div>
    </div>
  );
};
