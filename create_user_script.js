
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afvkapxaabgmltdtkgqb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdmthcHhhYWJnbWx0ZHRrZ3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MTQ0MjcsImV4cCI6MjA4MTI5MDQyN30.qsm1G3wHRWbfWZqToGYec8VYyo_y9KB32pDLVmGV4Bk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createUser() {
    const { data, error } = await supabase.auth.signUp({
        email: 'ram@videc.com',
        password: 'ram@123',
    });

    if (error) {
        console.error('Error creating user:', error);
    } else {
        console.log('User created:', data);
    }
}

createUser();
