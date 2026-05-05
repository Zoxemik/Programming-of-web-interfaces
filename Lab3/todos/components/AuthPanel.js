"use client";

import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { Auth, GoogleProvider } from "@/lib/FirebaseClient";

export default function AuthPanel(Props)
{
  const [CurrentUser, SetCurrentUser] = useState(null);
  const [Email, SetEmail] = useState("");
  const [Password, SetPassword] = useState("");
  const [Message, SetMessage] = useState("");

  useEffect(function SubscribeToAuth()
  {
    const Unsubscribe = onAuthStateChanged(Auth, function HandleAuthChange(User)
    {
      SetCurrentUser(User);

      if (Props.OnUserChange)
      {
        Props.OnUserChange(User);
      }
    });

    return function CleanupAuth()
    {
      Unsubscribe();
    };
  }, [Props.OnUserChange]);

  async function HandleGoogleSignIn()
  {
    SetMessage("");

    try
    {
      await signInWithPopup(Auth, GoogleProvider);
    }
    catch (Error)
    {
      SetMessage(Error.message);
    }
  }

  async function HandleEmailSignIn(Event)
  {
    Event.preventDefault();
    SetMessage("");

    try
    {
      await signInWithEmailAndPassword(Auth, Email, Password);
    }
    catch (Error)
    {
      SetMessage(Error.message);
    }
  }

  async function HandleRegister()
  {
    SetMessage("");

    try
    {
      await createUserWithEmailAndPassword(Auth, Email, Password);
    }
    catch (Error)
    {
      SetMessage(Error.message);
    }
  }

  async function HandleSignOut()
  {
    SetMessage("");

    try
    {
      await signOut(Auth);
    }
    catch (Error)
    {
      SetMessage(Error.message);
    }
  }

  if (CurrentUser)
  {
    return (
      <section className="soft-card p-4">
        <p className="text-xs font-bold uppercase text-stone-400">
          Zalogowano jako
        </p>

        <p className="mt-1 break-all text-sm font-black text-stone-900">
          {CurrentUser.email}
        </p>

        <button type="button" className="secondary-button mt-4 w-full" onClick={HandleSignOut}>
          Wyloguj
        </button>
      </section>
    );
  }

  return (
    <section className="soft-card p-4">
      <p className="mb-3 text-sm font-black text-stone-900">
        Logowanie
      </p>

      <button type="button" className="primary-button w-full" onClick={HandleGoogleSignIn}>
        Zaloguj przez Google
      </button>

      <form className="mt-4 grid gap-3" onSubmit={HandleEmailSignIn}>
        <input
          className="field-input"
          type="email"
          value={Email}
          onChange={function HandleEmailChange(Event)
          {
            SetEmail(Event.target.value);
          }}
          placeholder="email"
        />

        <input
          className="field-input"
          type="password"
          value={Password}
          onChange={function HandlePasswordChange(Event)
          {
            SetPassword(Event.target.value);
          }}
          placeholder="hasło"
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <button type="submit" className="secondary-button">
            Zaloguj
          </button>

          <button type="button" className="secondary-button" onClick={HandleRegister}>
            Załóż konto
          </button>
        </div>
      </form>

      {Message.length > 0 && (
        <p className="mt-3 text-xs font-bold text-red-700">
          {Message}
        </p>
      )}
    </section>
  );
}