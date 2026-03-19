import { useState } from "react";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    const handleRegister = async () => {
        const res = await fetch("http://localhost:8000/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        localStorage.setItem("token", data.token);

        console.log("Đăng ký thành công", data);
    };

    return (
        <div>
            <input placeholder="email" onChange={e => setEmail(e.target.value)} />
            <input placeholder="password" type="password" onChange={e => setPassword(e.target.value)} />
            <input placeholder="name" type="text" onChange={e => setName(e.target.value)} />
            <button onClick={handleRegister}>Đăng ký</button>
        </div>
    );
}