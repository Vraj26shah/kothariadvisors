const FIRM = {
  name: 'Kothari & Associates',
  tagline: 'Tax Advocates',
  phone: '+91 99794 34322',
  email: 'legal@kothariadvisors.com',
  address: '82, Khadayata Boarding Society, Opp. Bus Stand, Modasa - 383315, Gujarat, India',
};

exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firm: FIRM.name,
      tagline: FIRM.tagline,
      phone: FIRM.phone,
      email: FIRM.email,
      address: FIRM.address,
    }),
  };
};
