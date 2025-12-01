fetch('https://hqdudeuoapouypiadogv.supabase.co')
    .then(res => console.log('Status:', res.status))
    .catch(err => {
        console.error('Fetch error:', err.message);
        if (err.cause) console.error('Cause:', err.cause);
    });
