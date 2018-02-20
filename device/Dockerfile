FROM node:8-alpine
WORKDIR /device

COPY package.json .
RUN npm install

COPY . .
RUN chmod a+x ./sim.sh

CMD [ "sh", "sim.sh" ]
