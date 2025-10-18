fetch('https://ygfetzqnginriyurpbcs.supabase.co/auth/v1/health')
    .then(r => r.status)
    .then(console.log)
    .catch(console.error);
