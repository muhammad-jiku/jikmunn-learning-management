import Link from 'next/link';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <div className='footer'>
      <p>&copy; {year} jikmunn. All Rights Reserved.</p>
      <div className='footer__links'>
        {['About', 'Privacy Policy', 'Licensing', 'Contact'].map((item) => (
          <Link
            key={item}
            href={`/${item.toLowerCase().replace(' ', '-')}`}
            className='footer__link'
            scroll={false}
          >
            {item}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Footer;
