FROM node:14-alpine

WORKDIR /app

RUN apk update && apk upgrade
RUN apk add git

# Clone the repository
RUN git clone https://github.com/Kim5Possible/nuxt-todo.git .

RUN npm install && npm cache clean --force

ENV PATH ./node_modules/.bin/:$PATH


EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "dev"]