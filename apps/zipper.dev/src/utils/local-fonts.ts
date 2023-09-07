import localFont from 'next/font/local';

export const plakFont = localFont({
  src: [
    {
      path: '../../public/fonts/plaak/Plaak - 26-Ney-Light-205TF.otf',
      weight: '300',
      style: 'light',
    },
    {
      path: '../../public/fonts/plaak/Plaak - 36-Ney-Regular-205TF.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/plaak/Plaak - 46-Ney-Bold-205TF.otf',
      weight: '700',
      style: 'bold',
    },
    {
      path: '../../public/fonts/plaak/Plaak - 56-Ney-Heavy-205TF.otf',
      weight: '900',
      style: 'heavy',
    },
  ],
});
