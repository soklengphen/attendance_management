import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import norn from "../assets/norn.png";
import sothy from "../assets/sothy.png";
import villa from "../assets/villa.png";
import vey from "../assets/vey.png";
import rojeth from "../assets/rojet.png";
import lika from "../assets/ka.png";
import ratha from "../assets/ov.png";
import leng from "../assets/leng.png";

type TeamMember = {
  name: string;
  position: string;
  description: string;
  avatar: string;
};

const teamMembers: TeamMember[] = [
  {
    name: "Phen Sokleng",
    position: "Project Manager",
    description: "Leads the team and manages project timelines.",
    avatar: leng,
  },
  {
    name: "Bun Sothy",
    position: "Frontend Developer",
    description: "Builds responsive and user-friendly interfaces.",
    avatar: sothy,
  },
  {
    name: "Lor Chingvey",
    position: "Backend Developer",
    description: "Handles APIs and database integration.",
    avatar: vey,
  },
  {
    name: "Lay Villa",
    position: "UI/UX Designer",
    description: "Designs smooth and engaging user experiences.",
    avatar: villa,
  },
  {
    name: "Pin Rojeth",
    position: "DevOps Engineer",
    description: "Maintains CI/CD pipelines and server infrastructure.",
    avatar: rojeth,
  },
  {
    name: "Kim Soklika",
    position: "QA Engineer",
    description: "Ensures high quality through rigorous testing.",
    avatar: lika,
  },
  {
    name: "Song Norn",
    position: "Fullstack Developer",
    description: "Works across frontend and backend systems.",
    avatar: norn,
  },
  {
    name: "Vanna Thangratha",
    position: "Marketing Specialist",
    description: "Handles social media and outreach campaigns.",
    avatar: ratha,
  },
];

export const AboutUs: React.FC = () =>{
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider bg-blue-100 px-4 py-2 rounded-full">
              Meet Our Team
            </span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
            The People Behind Our Success
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A diverse group of talented individuals working together to create amazing experiences
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <Card 
              key={member.name}
              className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur hover:-translate-y-2"
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                {/* Avatar with gradient border */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-md opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                  <div className="relative p-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-28 h-28 rounded-full object-cover border-4 border-white"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {member.name}
                  </h3>
                  <div className="inline-block">
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {member.position}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed pt-2">
                    {member.description}
                  </p>
                </div>

                {/* Hover Effect Line */}
                <div className="w-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:w-full transition-all duration-300 rounded-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Want to Join Our Team?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            We're always looking for talented individuals who are passionate about making a difference
          </p>
          <button className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors duration-200 shadow-lg hover:shadow-xl">
            View Open Positions
          </button>
        </div>
      </div>
    </div>
  );
}

