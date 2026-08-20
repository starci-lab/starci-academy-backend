# Overview · Account authentication

## Purpose

One public authentication surface lets a visitor sign in, create an account through an emailed OTP, or reset a password through an emailed OTP before entering the protected console.

## Included

- Email/password sign-in
- Email OTP account creation
- Email OTP password reset
- Session restoration and protected-console redirect
- Backend two-factor challenge contract

## Excluded

- Two-factor code completion in the current frontend
- Account profile management
- Authorization roles beyond authenticated versus anonymous

## Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `97eec8c5bb4c8f4b9e4bb7c59ea771ed829841d9` |
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |
