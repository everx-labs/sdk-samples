# NodeJS SDK tonos-keys example

In this example we use [ton-client-node-js](https://github.com/tonlabs/ton-client-node-js) to generate tonos-compatible (compatible with Surf and tonos-cli) key pair from a seed phrase.

## Prerequisite

* Node.js >= [12.x installed](https://nodejs.org)

## Preparation

Install packages:

```sh
npm install
node tonosKeys.js
```

You will get the output:

```
Seed phrase "garden wedding range mixed during left powder grid modify safe recycle cup"

1 method. Tonos-compatible key pair:
{
  public: '99cb8fa0bbe3a34305d6d5d3f55ffeb775f8cecb1448f700aa9364fdcc258b3d',
  secret: 'fc7232e6e9869ced28cd3a6d8a651511026b0af5938087d43a77a81d011c2541'
}

Serialized extended master private key: 
xprv9s21ZrQH143K31fZRbkjY3S236yjf8RuYRvHMUm6YsSn8JkmpaDCEGZvZhpoCXt3yrWgt1roRn7v3g8kAX7jvp8hQ2RWEwYpNHU6zAJRLCk
Serialized derived extended private key: 
xprvA2W34Q8gAseYVyEckUFJjbV8LxCP2yP9vtKRYospW2HzWqfSKC4Ep6YVU65sjJZuAsbxqiToyJmKkceQsJPmBLxJxxfnd7rJJH86zqTuHiw
Derived private key: 
fc7232e6e9869ced28cd3a6d8a651511026b0af5938087d43a77a81d011c2541

2 method. Tonos-compatible key pair:
{
  public: '99cb8fa0bbe3a34305d6d5d3f55ffeb775f8cecb1448f700aa9364fdcc258b3d',
  secret: 'fc7232e6e9869ced28cd3a6d8a651511026b0af5938087d43a77a81d011c2541'
}
MacBook-Pro-Ekaterina:tonos-keys ekaterina$ 
```

